import { Coordinate } from "./kml-parser";
import { ElevationResolution } from "./elevation-resolution";

const ELEVATION_API =
  process.env.ELEVATION_API_URL || "http://elevation-engine:8080";
const DEFAULT_BATCH_SIZE = 1000;
const MAX_BATCH_RETRIES = 3;
const REQUEST_TIMEOUT_MS = 30_000;

export type ElevationResult = {
  lat: number;
  lon: number;
  elevation: number;
  file: string;
  pixel_x: number;
  pixel_y: number;
};

function getBatchSize() {
  const parsed = Number(process.env.ELEVATION_BATCH_SIZE ?? DEFAULT_BATCH_SIZE);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_BATCH_SIZE;
  }

  return Math.floor(parsed);
}

async function lookupChunk(
  points: Coordinate[],
  resolution?: ElevationResolution,
): Promise<ElevationResult[]> {
  const response = await fetch(`${ELEVATION_API}/lookup-batch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      points,
      ...(resolution ? { resolution } : {}),
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    const responseText = await response.text();

    throw new Error(
      `Elevation API request failed with status ${response.status}: ${responseText || "empty response body"}`,
    );
  }

  const json = await response.json();

  return json.results ?? [];
}

async function lookupChunkWithRetry(
  points: Coordinate[],
  resolution?: ElevationResolution,
) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_BATCH_RETRIES; attempt += 1) {
    try {
      return await lookupChunk(points, resolution);
    } catch (error) {
      lastError = error;

      if (attempt === MAX_BATCH_RETRIES) {
        break;
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Elevation API batch request failed.");
}

export async function lookupBatch(
  points: Coordinate[],
  options?: {
    resolution?: ElevationResolution;
  },
): Promise<ElevationResult[]> {
  if (points.length === 0) {
    return [];
  }

  const batchSize = getBatchSize();
  const results: ElevationResult[] = [];

  for (let index = 0; index < points.length; index += batchSize) {
    const chunk = points.slice(index, index + batchSize);
    const chunkResults = await lookupChunkWithRetry(chunk, options?.resolution);
    results.push(...chunkResults);
  }

  return results;
}

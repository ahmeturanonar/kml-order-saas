import { Coordinate } from "./kml-parser";

const ELEVATION_API =
  process.env.ELEVATION_API_URL || "http://elevation-engine:8080";

export type ElevationResult = {
  lat: number;
  lon: number;
  elevation: number;
  file: string;
  pixel_x: number;
  pixel_y: number;
};

export async function lookupBatch(
  points: Coordinate[],
): Promise<ElevationResult[]> {
  if (points.length === 0) {
    return [];
  }

  const response = await fetch(`${ELEVATION_API}/lookup-batch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      points,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Elevation API isteği başarısız.");
  }

  const json = await response.json();

  return json.results ?? [];
}

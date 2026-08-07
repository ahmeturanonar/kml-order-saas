export type Coordinate = {
  lat: number;
  lon: number;
};

export function parseCoordinates(xml: string): Coordinate[] {
  if (!xml.trim()) {
    throw new Error("KML file is empty.");
  }

  const regex = /<coordinates\b[^>]*>([\s\S]*?)<\/coordinates>/gi;
  const points: Coordinate[] = [];

  let match: RegExpExecArray | null;

  while ((match = regex.exec(xml)) !== null) {
    const coordinates = match[1].trim().split(/\s+/);

    for (const coordinate of coordinates) {
      const parts = coordinate.split(",");

      if (parts.length < 2) {
        continue;
      }

      const lon = Number(parts[0]);
      const lat = Number(parts[1]);

      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        continue;
      }

      points.push({
        lat,
        lon,
      });
    }
  }

  if (points.length === 0) {
    throw new Error("No valid coordinates were found in the KML file.");
  }

  return points;
}

export type Coordinate = {
  lat: number;
  lon: number;
};

export function parseCoordinates(xml: string): Coordinate[] {
  const regex = /<coordinates>([\s\S]*?)<\/coordinates>/g;

  const points: Coordinate[] = [];

  let match: RegExpExecArray | null;

  while ((match = regex.exec(xml)) !== null) {
    const coordinates = match[1].trim().split(/\s+/);

    for (const coordinate of coordinates) {
      const parts = coordinate.split(",");

      if (parts.length < 2) continue;

      const lon = Number(parts[0]);
      const lat = Number(parts[1]);

      if (Number.isNaN(lat) || Number.isNaN(lon)) continue;

      points.push({
        lat,
        lon,
      });
    }
  }

  return points;
}

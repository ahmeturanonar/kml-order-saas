const GENERATED_CSV_HEADERS = ["Enlem", "Boylam", "Metre"] as const;
const LEGACY_CSV_HEADERS = ["lat", "lon", "elevation"] as const;
const CSV_MIME_TYPE = "text/csv; charset=utf-8";

function escapeCsvValue(value: string | number) {
  const normalized = String(value);

  if (/[",\r\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, "\"\"")}"`;
  }

  return normalized;
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === "\"") {
      if (inQuotes && nextChar === "\"") {
        current += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }

      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function normalizeParsedRow(row: string[]) {
  if (row.length === 1 && row[0].includes(",")) {
    return parseCsvLine(row[0]);
  }

  return row;
}

function isHeaderRow(row: string[]) {
  if (row.length < 3) {
    return false;
  }

  const [first, second, third] = row.map((value) => value.trim().toLowerCase());

  return (
    (first === GENERATED_CSV_HEADERS[0].toLowerCase() &&
      second === GENERATED_CSV_HEADERS[1].toLowerCase() &&
      third === GENERATED_CSV_HEADERS[2].toLowerCase()) ||
    (first === LEGACY_CSV_HEADERS[0] &&
      second === LEGACY_CSV_HEADERS[1] &&
      third === LEGACY_CSV_HEADERS[2])
  );
}

export function buildGeneratedCsvBuffer(
  rows: Array<{ lat: string | number; lon: string | number; elevation: string | number }>,
) {
  const lines = [
    GENERATED_CSV_HEADERS.join(","),
    ...rows.map((row) =>
      [
        escapeCsvValue(row.lat),
        escapeCsvValue(row.lon),
        escapeCsvValue(row.elevation),
      ].join(","),
    ),
  ];

  return Buffer.from(`\uFEFF${lines.join("\r\n")}\r\n`, "utf8");
}

export function normalizeGeneratedCsvBuffer(buffer: Buffer) {
  const content = buffer.toString("utf8").replace(/^\uFEFF/, "");
  const rows = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => normalizeParsedRow(parseCsvLine(line)));

  if (rows.length === 0) {
    return buildGeneratedCsvBuffer([]);
  }

  const dataRows = isHeaderRow(rows[0]) ? rows.slice(1) : rows;
  const normalizedRows = dataRows
    .map((row) => row.slice(0, 3))
    .filter((row) => row.length === 3)
    .map(([lat, lon, elevation]) => ({ lat, lon, elevation }));

  return buildGeneratedCsvBuffer(normalizedRows);
}

export { CSV_MIME_TYPE };

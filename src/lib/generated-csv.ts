const GENERATED_CSV_HEADERS = ["Enlem", "Boylam", "Metre"] as const;
const LEGACY_CSV_HEADERS = ["lat", "lon", "elevation"] as const;
const CSV_DELIMITER = ",";
const SUPPORTED_CSV_DELIMITERS = [",", ";"] as const;
const EXCEL_SEPARATOR_DIRECTIVE = `sep=${CSV_DELIMITER}`;
const CSV_MIME_TYPE = "text/csv; charset=utf-8";

type CsvDelimiter = (typeof SUPPORTED_CSV_DELIMITERS)[number];

function escapeCsvValue(value: string | number, delimiter: CsvDelimiter) {
  const normalized = String(value);

  if (new RegExp(`[\"${delimiter}\r\n]`).test(normalized)) {
    return `"${normalized.replace(/"/g, "\"\"")}"`;
  }

  return normalized;
}

function unwrapExcelTextFormula(value: string | number) {
  const normalized = String(value).trim();

  if (!normalized.startsWith("=")) {
    return normalized;
  }

  const withoutEquals = normalized.slice(1).trim();

  if (withoutEquals.startsWith("\"") && withoutEquals.endsWith("\"")) {
    return withoutEquals.slice(1, -1);
  }

  return withoutEquals;
}

function formatExcelSafeDecimal(value: string | number) {
  const normalized = unwrapExcelTextFormula(value);

  if (/^-?\d+\.\d+$/.test(normalized)) {
    return `="${normalized}"`;
  }

  return escapeCsvValue(normalized, CSV_DELIMITER);
}

function parseCsvLine(line: string, delimiter: CsvDelimiter) {
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

    if (char === delimiter && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function getDelimiterFromDirective(line: string): CsvDelimiter | null {
  const normalized = line.trim().toLowerCase();

  if (!normalized.startsWith("sep=")) {
    return null;
  }

  const delimiter = normalized.slice(4, 5);
  return SUPPORTED_CSV_DELIMITERS.includes(delimiter as CsvDelimiter)
    ? (delimiter as CsvDelimiter)
    : null;
}

function countDelimiterOccurrences(line: string, delimiter: CsvDelimiter) {
  let count = 0;
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === "\"") {
      if (inQuotes && nextChar === "\"") {
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }

      continue;
    }

    if (char === delimiter && !inQuotes) {
      count += 1;
    }
  }

  return count;
}

function detectCsvDelimiter(line: string): CsvDelimiter {
  let bestDelimiter: CsvDelimiter = CSV_DELIMITER;
  let bestScore = -1;

  for (const delimiter of SUPPORTED_CSV_DELIMITERS) {
    const score = countDelimiterOccurrences(line, delimiter);

    if (score > bestScore) {
      bestDelimiter = delimiter;
      bestScore = score;
    }
  }

  return bestDelimiter;
}

function parseCsvLineWithFallback(line: string, delimiter: CsvDelimiter) {
  const parsed = parseCsvLine(line, delimiter);
  if (parsed.length > 1) {
    return parsed;
  }

  for (const candidate of SUPPORTED_CSV_DELIMITERS) {
    if (candidate === delimiter) {
      continue;
    }

    const fallbackParsed = parseCsvLine(line, candidate);
    if (fallbackParsed.length > 1) {
      return fallbackParsed;
    }
  }

  return parsed;
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
    EXCEL_SEPARATOR_DIRECTIVE,
    GENERATED_CSV_HEADERS.join(CSV_DELIMITER),
    ...rows.map((row) =>
      [
        formatExcelSafeDecimal(row.lat),
        formatExcelSafeDecimal(row.lon),
        escapeCsvValue(unwrapExcelTextFormula(row.elevation), CSV_DELIMITER),
      ].join(CSV_DELIMITER),
    ),
  ];

  return Buffer.from(`\uFEFF${lines.join("\r\n")}\r\n`, "utf8");
}

export function normalizeGeneratedCsvBuffer(buffer: Buffer) {
  const content = buffer.toString("utf8").replace(/^\uFEFF/, "");
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return buildGeneratedCsvBuffer([]);
  }

  const directiveDelimiter = getDelimiterFromDirective(lines[0]);
  const dataLines = directiveDelimiter ? lines.slice(1) : lines;

  if (dataLines.length === 0) {
    return buildGeneratedCsvBuffer([]);
  }

  const detectedDelimiter = directiveDelimiter ?? detectCsvDelimiter(dataLines[0]);
  const rows = dataLines.map((line) => parseCsvLineWithFallback(line, detectedDelimiter));
  const dataRows = isHeaderRow(rows[0]) ? rows.slice(1) : rows;
  const normalizedRows = dataRows
    .map((row) => row.slice(0, 3))
    .filter((row) => row.length === 3)
    .map(([lat, lon, elevation]) => ({ lat, lon, elevation }));

  return buildGeneratedCsvBuffer(normalizedRows);
}

export { CSV_DELIMITER, CSV_MIME_TYPE, EXCEL_SEPARATOR_DIRECTIVE };

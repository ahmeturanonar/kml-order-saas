const GENERATED_HEADERS = ["Enlem", "Boylam", "Metre"] as const;
const LEGACY_HEADERS = ["lat", "lon", "elevation"] as const;
const DEFAULT_CSV_DELIMITER = ",";
const SUPPORTED_CSV_DELIMITERS = [",", ";", "|", "\t"] as const;
const GENERATED_FILE_EXTENSION = ".xlsx";
const GENERATED_FILE_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

type CsvDelimiter = (typeof SUPPORTED_CSV_DELIMITERS)[number];

type GeneratedRow = {
  lat: string;
  lon: string;
  elevation: string;
};

type ZipEntry = {
  name: string;
  data: Buffer;
};

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function normalizeCellValue(value: string | number) {
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

function detectDelimiter(line: string) {
  let bestDelimiter: CsvDelimiter = DEFAULT_CSV_DELIMITER;
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

function getDelimiterFromDirective(line: string): CsvDelimiter | null {
  const trimmed = line.trim();
  if (!trimmed.toLowerCase().startsWith("sep=")) {
    return null;
  }

  const value = trimmed.slice(4);
  return SUPPORTED_CSV_DELIMITERS.includes(value as CsvDelimiter)
    ? (value as CsvDelimiter)
    : null;
}

function parseCsvLineWithFallback(line: string, delimiter: CsvDelimiter) {
  const primary = parseCsvLine(line, delimiter);
  if (primary.length > 1) {
    return primary;
  }

  for (const candidate of SUPPORTED_CSV_DELIMITERS) {
    if (candidate === delimiter) {
      continue;
    }

    const fallback = parseCsvLine(line, candidate);
    if (fallback.length > 1) {
      return fallback;
    }
  }

  return primary;
}

function isHeaderRow(row: string[]) {
  if (row.length < 3) {
    return false;
  }

  const [first, second, third] = row.map((value) => value.trim().toLowerCase());

  return (
    (first === GENERATED_HEADERS[0].toLowerCase() &&
      second === GENERATED_HEADERS[1].toLowerCase() &&
      third === GENERATED_HEADERS[2].toLowerCase()) ||
    (first === LEGACY_HEADERS[0] &&
      second === LEGACY_HEADERS[1] &&
      third === LEGACY_HEADERS[2])
  );
}

function parseRowsFromCsvBuffer(buffer: Buffer) {
  const content = buffer.toString("utf8").replace(/^\uFEFF/, "");
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return [] as GeneratedRow[];
  }

  const directiveDelimiter = getDelimiterFromDirective(lines[0]);
  const dataLines = directiveDelimiter ? lines.slice(1) : lines;

  if (dataLines.length === 0) {
    return [] as GeneratedRow[];
  }

  const detectedDelimiter = directiveDelimiter ?? detectDelimiter(dataLines[0]);
  const rows = dataLines.map((line) => parseCsvLineWithFallback(line, detectedDelimiter));
  const dataRows = isHeaderRow(rows[0]) ? rows.slice(1) : rows;

  return dataRows
    .map((row) => row.slice(0, 3))
    .filter((row) => row.length === 3)
    .map(([lat, lon, elevation]) => ({
      lat: normalizeCellValue(lat),
      lon: normalizeCellValue(lon),
      elevation: normalizeCellValue(elevation),
    }));
}

function buildSheetXml(rows: GeneratedRow[]) {
  const allRows = [
    GENERATED_HEADERS.map((value) => ({ value, numeric: false })),
    ...rows.map((row) => [
      { value: row.lat, numeric: false },
      { value: row.lon, numeric: false },
      { value: row.elevation, numeric: false },
    ]),
  ];

  const xmlRows = allRows
    .map((cells, rowIndex) => {
      const xmlCells = cells
        .map((cell, columnIndex) => {
          const reference = `${String.fromCharCode(65 + columnIndex)}${rowIndex + 1}`;

          if (cell.numeric) {
            return `<c r="${reference}"><v>${escapeXml(cell.value)}</v></c>`;
          }

          return `<c r="${reference}" t="inlineStr"><is><t>${escapeXml(cell.value)}</t></is></c>`;
        })
        .join("");

      return `<row r="${rowIndex + 1}">${xmlCells}</row>`;
    })
    .join("");

  return Buffer.from(
    [
      "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>",
      "<worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\">",
      "<sheetViews><sheetView workbookViewId=\"0\"/></sheetViews>",
      "<sheetFormatPr defaultRowHeight=\"15\"/>",
      "<cols><col min=\"1\" max=\"1\" width=\"20\" customWidth=\"1\"/><col min=\"2\" max=\"2\" width=\"20\" customWidth=\"1\"/><col min=\"3\" max=\"3\" width=\"12\" customWidth=\"1\"/></cols>",
      `<sheetData>${xmlRows}</sheetData>`,
      "</worksheet>",
    ].join(""),
    "utf8",
  );
}

function buildWorkbookXml() {
  return Buffer.from(
    [
      "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>",
      "<workbook xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\">",
      "<sheets>",
      "<sheet name=\"Sonuclar\" sheetId=\"1\" r:id=\"rId1\"/>",
      "</sheets>",
      "</workbook>",
    ].join(""),
    "utf8",
  );
}

function buildWorkbookRelationshipsXml() {
  return Buffer.from(
    [
      "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>",
      "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">",
      "<Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"worksheets/sheet1.xml\"/>",
      "</Relationships>",
    ].join(""),
    "utf8",
  );
}

function buildRootRelationshipsXml() {
  return Buffer.from(
    [
      "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>",
      "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">",
      "<Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"xl/workbook.xml\"/>",
      "</Relationships>",
    ].join(""),
    "utf8",
  );
}

function buildContentTypesXml() {
  return Buffer.from(
    [
      "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>",
      "<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\">",
      "<Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/>",
      "<Default Extension=\"xml\" ContentType=\"application/xml\"/>",
      "<Override PartName=\"/xl/workbook.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\"/>",
      "<Override PartName=\"/xl/worksheets/sheet1.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/>",
      "</Types>",
    ].join(""),
    "utf8",
  );
}

function createCrc32Table() {
  const table = new Uint32Array(256);

  for (let index = 0; index < 256; index += 1) {
    let value = index;

    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) === 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }

    table[index] = value >>> 0;
  }

  return table;
}

const CRC32_TABLE = createCrc32Table();

function crc32(buffer: Buffer) {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc = CRC32_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function writeDosTime() {
  return { time: 0, date: 0 };
}

function createZipBuffer(entries: ZipEntry[]) {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuffer = Buffer.from(entry.name, "utf8");
    const dataBuffer = entry.data;
    const crc = crc32(dataBuffer);
    const { time, date } = writeDosTime();

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(time, 10);
    localHeader.writeUInt16LE(date, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(dataBuffer.length, 18);
    localHeader.writeUInt32LE(dataBuffer.length, 22);
    localHeader.writeUInt16LE(nameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localParts.push(localHeader, nameBuffer, dataBuffer);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(time, 12);
    centralHeader.writeUInt16LE(date, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(dataBuffer.length, 20);
    centralHeader.writeUInt32LE(dataBuffer.length, 24);
    centralHeader.writeUInt16LE(nameBuffer.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    centralParts.push(centralHeader, nameBuffer);
    offset += localHeader.length + nameBuffer.length + dataBuffer.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const localDirectory = Buffer.concat(localParts);
  const endRecord = Buffer.alloc(22);

  endRecord.writeUInt32LE(0x06054b50, 0);
  endRecord.writeUInt16LE(0, 4);
  endRecord.writeUInt16LE(0, 6);
  endRecord.writeUInt16LE(entries.length, 8);
  endRecord.writeUInt16LE(entries.length, 10);
  endRecord.writeUInt32LE(centralDirectory.length, 12);
  endRecord.writeUInt32LE(localDirectory.length, 16);
  endRecord.writeUInt16LE(0, 20);

  return Buffer.concat([localDirectory, centralDirectory, endRecord]);
}

function buildWorkbookBuffer(rows: GeneratedRow[]) {
  return createZipBuffer([
    {
      name: "[Content_Types].xml",
      data: buildContentTypesXml(),
    },
    {
      name: "_rels/.rels",
      data: buildRootRelationshipsXml(),
    },
    {
      name: "xl/workbook.xml",
      data: buildWorkbookXml(),
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      data: buildWorkbookRelationshipsXml(),
    },
    {
      name: "xl/worksheets/sheet1.xml",
      data: buildSheetXml(rows),
    },
  ]);
}

function isXlsxBuffer(buffer: Buffer) {
  return buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b;
}

export function buildGeneratedCsvBuffer(
  rows: Array<{ lat: string | number; lon: string | number; elevation: string | number }>,
) {
  return buildWorkbookBuffer(
    rows.map((row) => ({
      lat: normalizeCellValue(row.lat),
      lon: normalizeCellValue(row.lon),
      elevation: normalizeCellValue(row.elevation),
    })),
  );
}

export function normalizeGeneratedCsvBuffer(buffer: Buffer) {
  if (isXlsxBuffer(buffer)) {
    return buffer;
  }

  return buildWorkbookBuffer(parseRowsFromCsvBuffer(buffer));
}

export {
  GENERATED_FILE_EXTENSION,
  GENERATED_FILE_MIME_TYPE,
};

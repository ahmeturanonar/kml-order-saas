export const CREDIT_PACKAGES = [100, 250, 500, 1000] as const;
export const DEFAULT_KML_PRICE = Number(process.env.DEFAULT_KML_PRICE ?? "50");
export const MAX_KML_FILE_SIZE_BYTES = 50 * 1024 * 1024;
export const ALLOWED_KML_EXTENSIONS = [".kml"];
export const ALLOWED_KML_MIME_TYPES = [
  "application/vnd.google-earth.kml+xml",
  "application/xml",
  "text/xml",
  "application/octet-stream",
];
export const PASSWORD_RESET_TTL_MINUTES = 30;
export const ORDER_NUMBER_OFFSET = 1000;

import crypto from "node:crypto";
import { NextResponse } from "next/server";

function getDesktopAgentApiKey() {
  const apiKey = process.env.DESKTOP_AGENT_API_KEY;

  if (!apiKey) {
    throw new Error("DESKTOP_AGENT_API_KEY is not configured.");
  }

  return apiKey;
}

function safeCompare(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

export function assertDesktopAgentRequest(request: Request) {
  const incomingApiKey = request.headers.get("x-api-key");

  if (!incomingApiKey) {
    return NextResponse.json({ message: "Missing X-API-Key header." }, { status: 401 });
  }

  const configuredApiKey = getDesktopAgentApiKey();
  if (!safeCompare(incomingApiKey, configuredApiKey)) {
    return NextResponse.json({ message: "Invalid API key." }, { status: 401 });
  }

  return null;
}

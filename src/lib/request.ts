import { headers } from "next/headers";
import { getAppUrl } from "@/lib/env";

export async function assertSameOriginRequest() {
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");

  if (!origin) {
    return;
  }

  const appUrl = new URL(getAppUrl());
  const requestOrigin = new URL(origin);

  if (appUrl.origin !== requestOrigin.origin) {
    throw new Error("Invalid request origin.");
  }
}

export function assertRequestOrigin(request: Request) {
  const origin = request.headers.get("origin");

  if (!origin) {
    return;
  }

  const appUrl = new URL(getAppUrl());
  const requestOrigin = new URL(origin);

  if (appUrl.origin !== requestOrigin.origin) {
    throw new Error("Invalid request origin.");
  }
}

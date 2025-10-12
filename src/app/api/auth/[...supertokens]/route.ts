import { NextRequest } from "next/server";
import { getAppDirRequestHandler } from "supertokens-node/nextjs";
import "@/lib/supertokensConfig";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handler = getAppDirRequestHandler();

export function GET(request: NextRequest) {
  return handler(request);
}

export const POST = GET;
export const PUT = GET;
export const DELETE = GET;
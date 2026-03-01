import { ok } from "@/lib/api/http";
import { getOpenApiDocument } from "@/lib/openapi/spec";

const document = getOpenApiDocument();

export async function GET() {
  return ok(document);
}

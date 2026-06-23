import { clearSessionCookie } from "@/lib/session";
import { errorResponse } from "@/lib/api-utils";

export async function POST() {
  try {
    await clearSessionCookie();
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

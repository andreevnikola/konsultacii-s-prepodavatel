import { ZodError } from "zod";
import { AuthError, ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { getSession } from "@/lib/session";
import type { NextRequest } from "next/server";

export function errorResponse(error: unknown): Response {
  if (error instanceof NotFoundError) {
    return Response.json({ error: error.message }, { status: 404 });
  }
  if (error instanceof ConflictError) {
    return Response.json({ error: error.message }, { status: 409 });
  }
  if (error instanceof AuthError) {
    return Response.json({ error: error.message }, { status: 401 });
  }
  if (error instanceof ValidationError) {
    return Response.json({ error: error.message }, { status: 422 });
  }
  if (error instanceof ZodError) {
    return Response.json({ error: "Validation error", issues: error.issues }, { status: 422 });
  }
  console.error(error);
  return Response.json({ error: "Internal server error" }, { status: 500 });
}

/** Returns the authenticated teacherId or throws AuthError. */
export function requireAuth(request: NextRequest): string {
  const session = getSession(request);
  if (!session) {
    throw new AuthError("Authentication required.");
  }
  return session.teacherId;
}

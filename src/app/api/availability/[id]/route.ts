import type { NextRequest } from "next/server";
import {
  getAvailabilitySlot,
  updateAvailabilitySlot,
  deleteAvailabilitySlot,
} from "@/server/services/availabilityService";
import { errorResponse, requireAuth } from "@/lib/api-utils";
import { AuthError } from "@/lib/errors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireAuth(request);
    const { id } = await params;
    const slot = await getAvailabilitySlot(id);
    return Response.json(slot);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const teacherId = requireAuth(request);
    const { id } = await params;
    const slot = await getAvailabilitySlot(id);
    if (slot.teacherId !== teacherId) {
      throw new AuthError("Forbidden.");
    }
    const body = await request.json();
    const updated = await updateAvailabilitySlot(id, body);
    return Response.json(updated);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const teacherId = requireAuth(request);
    const { id } = await params;
    const slot = await getAvailabilitySlot(id);
    if (slot.teacherId !== teacherId) {
      throw new AuthError("Forbidden.");
    }
    await deleteAvailabilitySlot(id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}

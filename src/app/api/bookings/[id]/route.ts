import type { NextRequest } from "next/server";
import {
  getBooking,
  changeBookingStatus,
  cancelBooking,
} from "@/server/services/bookingService";
import { errorResponse, requireAuth } from "@/lib/api-utils";
import { AuthError } from "@/lib/errors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const teacherId = requireAuth(request);
    const { id } = await params;
    const booking = await getBooking(id);
    if (booking.teacherId !== teacherId) {
      throw new AuthError("Forbidden.");
    }
    return Response.json(booking);
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
    const booking = await getBooking(id);
    if (booking.teacherId !== teacherId) {
      throw new AuthError("Forbidden.");
    }
    const body = await request.json();
    const updated = await changeBookingStatus(id, body);
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
    const booking = await getBooking(id);
    if (booking.teacherId !== teacherId) {
      throw new AuthError("Forbidden.");
    }
    await cancelBooking(id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}

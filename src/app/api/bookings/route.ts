import type { NextRequest } from "next/server";
import {
  createStudentBooking,
  listBookingsForTeacher,
} from "@/server/services/bookingService";
import { getAvailabilitySlot } from "@/server/services/availabilityService";
import { errorResponse, requireAuth } from "@/lib/api-utils";
import { AuthError, NotFoundError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const teacherId = requireAuth(request);
    const body = await request.json();
    const { availabilityId, ...studentData } = body as {
      availabilityId: unknown;
      [key: string]: unknown;
    };
    if (!availabilityId || typeof availabilityId !== "string") {
      throw new NotFoundError("availabilityId is required.");
    }
    const slot = await getAvailabilitySlot(availabilityId);
    if (slot.teacherId !== teacherId) {
      throw new AuthError("Forbidden.");
    }
    const booking = await createStudentBooking(availabilityId, studentData);
    return Response.json(booking, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const teacherId = requireAuth(request);
    const bookings = await listBookingsForTeacher(teacherId);
    return Response.json(bookings);
  } catch (error) {
    return errorResponse(error);
  }
}

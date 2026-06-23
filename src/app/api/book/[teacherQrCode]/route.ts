import type { NextRequest } from "next/server";
import { getTeacherByQrCode } from "@/server/services/teacherService";
import {
  listTeacherAvailability,
  getAvailabilitySlot,
} from "@/server/services/availabilityService";
import { createStudentBooking } from "@/server/services/bookingService";
import { errorResponse } from "@/lib/api-utils";
import { NotFoundError } from "@/lib/errors";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ teacherQrCode: string }> }
) {
  try {
    const { teacherQrCode } = await params;
    const teacher = await getTeacherByQrCode(teacherQrCode);
    const now = new Date();
    const allSlots = await listTeacherAvailability(teacher.id);
    const slots = allSlots.filter((s) => s.isActive && s.date > now);
    return Response.json({ teacher, slots });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teacherQrCode: string }> }
) {
  try {
    const { teacherQrCode } = await params;
    const teacher = await getTeacherByQrCode(teacherQrCode);

    const body = await request.json();
    const { availabilityId, ...studentData } = body as {
      availabilityId: unknown;
      [key: string]: unknown;
    };

    if (!availabilityId || typeof availabilityId !== "string") {
      throw new NotFoundError("availabilityId is required.");
    }

    const slot = await getAvailabilitySlot(availabilityId);
    if (slot.teacherId !== teacher.id) {
      throw new NotFoundError("Availability not found for this teacher.");
    }

    const booking = await createStudentBooking(availabilityId, studentData);
    return Response.json(booking, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

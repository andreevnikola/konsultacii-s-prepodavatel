import type { NextRequest } from "next/server";
import {
  createAvailabilitySlots,
  listTeacherAvailability,
} from "@/server/services/availabilityService";
import { errorResponse, requireAuth } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const teacherId = requireAuth(request);
    const body = await request.json();
    const slots = await createAvailabilitySlots(teacherId, body);
    return Response.json(slots, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const teacherId = requireAuth(request);
    const slots = await listTeacherAvailability(teacherId);
    return Response.json(slots);
  } catch (error) {
    return errorResponse(error);
  }
}

import type { NextRequest } from "next/server";
import {
  registerTeacher,
  listAllTeachers,
} from "@/server/services/teacherService";
import { errorResponse } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const teacher = await registerTeacher(body);
    return Response.json(teacher, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET() {
  try {
    const teachers = await listAllTeachers();
    return Response.json(teachers);
  } catch (error) {
    return errorResponse(error);
  }
}

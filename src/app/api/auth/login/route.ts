import type { NextRequest } from "next/server";
import { loginTeacher } from "@/server/services/teacherService";
import { setSessionCookie } from "@/lib/session";
import { errorResponse } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const teacher = await loginTeacher(body);
    await setSessionCookie(teacher.id);
    return Response.json(teacher);
  } catch (error) {
    return errorResponse(error);
  }
}

import type { NextRequest } from "next/server";
import {
  getTeacherProfile,
  updateTeacherProfile,
  deleteTeacherAccount,
} from "@/server/services/teacherService";
import { errorResponse, requireAuth } from "@/lib/api-utils";
import { AuthError } from "@/lib/errors";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const teacher = await getTeacherProfile(id);
    return Response.json(teacher);
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
    if (teacherId !== id) {
      throw new AuthError("Forbidden.");
    }
    const body = await request.json();
    const teacher = await updateTeacherProfile(id, body);
    return Response.json(teacher);
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
    if (teacherId !== id) {
      throw new AuthError("Forbidden.");
    }
    await deleteTeacherAccount(id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}

import { prisma } from "@/lib/prisma";
import type { Prisma, Teacher } from "@/generated/prisma/client";

export async function createTeacher(
  data: Prisma.TeacherCreateInput
): Promise<Teacher> {
  return prisma.teacher.create({ data });
}

export async function getTeacherById(id: string): Promise<Teacher | null> {
  return prisma.teacher.findUnique({ where: { id } });
}

export async function getTeacherByEmail(
  email: string
): Promise<Teacher | null> {
  return prisma.teacher.findUnique({ where: { email } });
}

export async function getTeacherByQrCodeSlug(
  qrCodeSlug: string
): Promise<Teacher | null> {
  return prisma.teacher.findUnique({ where: { qrCodeSlug } });
}

export async function updateTeacher(
  id: string,
  data: Prisma.TeacherUpdateInput
): Promise<Teacher> {
  return prisma.teacher.update({ where: { id }, data });
}

export async function deleteTeacher(id: string): Promise<Teacher> {
  return prisma.teacher.delete({ where: { id } });
}

export async function listTeachers() {
  return prisma.teacher.findMany({
    omit: { passwordHash: true },
    orderBy: { fullName: "asc" },
  });
}

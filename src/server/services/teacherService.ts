import {
  createTeacher,
  getTeacherByEmail,
  getTeacherById,
  getTeacherByQrCodeSlug,
  updateTeacher,
  deleteTeacher,
  listTeachers,
} from "@/server/repositories/teacherRepository";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { generateQrCodeSlug } from "@/lib/qr";
import {
  RegisterTeacherSchema,
  LoginTeacherSchema,
  UpdateTeacherSchema,
} from "@/lib/validation";
import { AuthError, ConflictError, NotFoundError } from "@/lib/errors";
import type { Teacher } from "@/generated/prisma/client";

type SafeTeacher = Omit<Teacher, "passwordHash">;

function stripHash(teacher: Teacher): SafeTeacher {
  const { passwordHash: _, ...safe } = teacher;
  return safe;
}

export async function registerTeacher(input: unknown): Promise<SafeTeacher> {
  const data = RegisterTeacherSchema.parse(input);

  const existing = await getTeacherByEmail(data.email);
  if (existing) {
    throw new ConflictError("Email already registered.");
  }

  let slug: string;
  do {
    slug = generateQrCodeSlug();
  } while (await getTeacherByQrCodeSlug(slug));

  const passwordHash = await hashPassword(data.password);

  const teacher = await createTeacher({
    fullName: data.fullName,
    email: data.email,
    passwordHash,
    subject: data.subject,
    qrCodeSlug: slug,
  });

  return stripHash(teacher);
}

export async function loginTeacher(
  input: unknown
): Promise<SafeTeacher & { id: string }> {
  const data = LoginTeacherSchema.parse(input);

  const teacher = await getTeacherByEmail(data.email);
  if (!teacher) {
    throw new AuthError("Invalid credentials.");
  }

  const valid = await verifyPassword(data.password, teacher.passwordHash);
  if (!valid) {
    throw new AuthError("Invalid credentials.");
  }

  return stripHash(teacher);
}

export async function getTeacherProfile(id: string): Promise<SafeTeacher> {
  const teacher = await getTeacherById(id);
  if (!teacher) {
    throw new NotFoundError("Teacher not found.");
  }
  return stripHash(teacher);
}

export async function getTeacherByQrCode(slug: string): Promise<SafeTeacher> {
  const teacher = await getTeacherByQrCodeSlug(slug);
  if (!teacher) {
    throw new NotFoundError("Teacher not found.");
  }
  return stripHash(teacher);
}

export async function updateTeacherProfile(
  id: string,
  input: unknown
): Promise<SafeTeacher> {
  const data = UpdateTeacherSchema.parse(input);

  const existing = await getTeacherById(id);
  if (!existing) {
    throw new NotFoundError("Teacher not found.");
  }

  const teacher = await updateTeacher(id, data);
  return stripHash(teacher);
}

export async function deleteTeacherAccount(id: string): Promise<void> {
  const existing = await getTeacherById(id);
  if (!existing) {
    throw new NotFoundError("Teacher not found.");
  }
  await deleteTeacher(id);
}

export async function listAllTeachers() {
  return listTeachers();
}

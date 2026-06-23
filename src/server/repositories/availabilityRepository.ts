import { prisma } from "@/lib/prisma";
import type { ConsultationAvailability, Prisma } from "@/generated/prisma/client";

export async function createAvailability(
  data: Prisma.ConsultationAvailabilityUncheckedCreateInput
): Promise<ConsultationAvailability> {
  return prisma.consultationAvailability.create({ data });
}

export async function getAvailabilityById(
  id: string
): Promise<ConsultationAvailability | null> {
  return prisma.consultationAvailability.findUnique({ where: { id } });
}

export async function listAvailabilityByTeacher(
  teacherId: string
): Promise<ConsultationAvailability[]> {
  return prisma.consultationAvailability.findMany({
    where: { teacherId },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
}

export async function updateAvailability(
  id: string,
  data: Prisma.ConsultationAvailabilityUpdateInput
): Promise<ConsultationAvailability> {
  return prisma.consultationAvailability.update({ where: { id }, data });
}

export async function deleteAvailability(
  id: string
): Promise<ConsultationAvailability> {
  return prisma.consultationAvailability.delete({ where: { id } });
}

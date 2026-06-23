import { prisma } from "@/lib/prisma";
import type { Booking, BookingStatus, Prisma } from "@/generated/prisma/client";

export async function createBooking(
  data: Prisma.BookingUncheckedCreateInput
): Promise<Booking> {
  return prisma.booking.create({ data });
}

export async function getBookingById(id: string): Promise<Booking | null> {
  return prisma.booking.findUnique({ where: { id } });
}

export async function listBookingsByTeacher(
  teacherId: string
): Promise<Booking[]> {
  return prisma.booking.findMany({
    where: { teacherId },
    orderBy: { createdAt: "desc" },
  });
}

export async function listBookingsByAvailability(
  availabilityId: string
): Promise<Booking[]> {
  return prisma.booking.findMany({
    where: { availabilityId },
    orderBy: { createdAt: "asc" },
  });
}

export async function updateBookingStatus(
  id: string,
  status: BookingStatus
): Promise<Booking> {
  return prisma.booking.update({ where: { id }, data: { status } });
}

export async function deleteBooking(id: string): Promise<Booking> {
  return prisma.booking.delete({ where: { id } });
}

export async function countBookingsByAvailabilityIds(
  ids: string[]
): Promise<Record<string, number>> {
  if (ids.length === 0) return {};
  const groups = await prisma.booking.groupBy({
    by: ["availabilityId"],
    where: { availabilityId: { in: ids } },
    _count: { id: true },
  });
  return Object.fromEntries(
    groups.map((g) => [g.availabilityId, g._count.id])
  );
}

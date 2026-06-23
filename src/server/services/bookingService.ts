import {
  createBooking,
  getBookingById,
  listBookingsByTeacher,
  updateBookingStatus,
  deleteBooking,
  countBookingsByAvailabilityIds,
} from "@/server/repositories/bookingRepository";
import { getAvailabilityById } from "@/server/repositories/availabilityRepository";
import { getTeacherById } from "@/server/repositories/teacherRepository";
import { CreateBookingSchema, UpdateBookingStatusSchema } from "@/lib/validation";
import { NotFoundError, ValidationError } from "@/lib/errors";
import type { Booking, BookingStatus } from "@/generated/prisma/client";

export async function createStudentBooking(
  availabilityId: string,
  input: unknown
): Promise<Booking> {
  const data = CreateBookingSchema.parse(input);

  const slot = await getAvailabilityById(availabilityId);
  if (!slot) {
    throw new NotFoundError("Availability slot not found.");
  }
  if (!slot.isActive) {
    throw new ValidationError("This slot is no longer available.");
  }

  const teacher = await getTeacherById(slot.teacherId);
  if (!teacher) {
    throw new NotFoundError("Teacher not found.");
  }

  return createBooking({
    teacherId: slot.teacherId,
    availabilityId,
    studentName: data.studentName,
    studentClass: data.studentClass,
    studentEmail: data.studentEmail,
    status: "CONFIRMED",
  });
}

export async function getBooking(id: string): Promise<Booking> {
  const booking = await getBookingById(id);
  if (!booking) {
    throw new NotFoundError("Booking not found.");
  }
  return booking;
}

export async function listBookingsForTeacher(
  teacherId: string
): Promise<Booking[]> {
  return listBookingsByTeacher(teacherId);
}

export async function changeBookingStatus(
  id: string,
  input: unknown
): Promise<Booking> {
  const { status } = UpdateBookingStatusSchema.parse(input);

  const booking = await getBookingById(id);
  if (!booking) {
    throw new NotFoundError("Booking not found.");
  }

  return updateBookingStatus(id, status as BookingStatus);
}

export async function cancelBooking(id: string): Promise<void> {
  const booking = await getBookingById(id);
  if (!booking) {
    throw new NotFoundError("Booking not found.");
  }
  await deleteBooking(id);
}

export async function getBookingCountsForSlots(
  slotIds: string[]
): Promise<Record<string, number>> {
  return countBookingsByAvailabilityIds(slotIds);
}

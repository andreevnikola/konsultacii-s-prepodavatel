import {
  createAvailability,
  getAvailabilityById,
  listAvailabilityByTeacher,
  updateAvailability,
  deleteAvailability,
} from "@/server/repositories/availabilityRepository";
import {
  CreateAvailabilitySchema,
  UpdateAvailabilitySchema,
} from "@/lib/validation";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import type { ConsultationAvailability } from "@/generated/prisma/client";

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function timesOverlap(
  s1: string,
  e1: string,
  s2: string,
  e2: string
): boolean {
  return timeToMinutes(s1) < timeToMinutes(e2) &&
    timeToMinutes(e1) > timeToMinutes(s2);
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

async function assertNoOverlap(
  teacherId: string,
  date: Date,
  startTime: string,
  endTime: string,
  excludeId?: string
): Promise<void> {
  const slots = await listAvailabilityByTeacher(teacherId);
  const conflict = slots.find(
    (s) =>
      s.id !== excludeId &&
      s.isActive &&
      sameDay(s.date, date) &&
      timesOverlap(startTime, endTime, s.startTime, s.endTime)
  );
  if (conflict) {
    throw new ConflictError(
      "Slot overlaps with an existing active availability."
    );
  }
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export async function createAvailabilitySlots(
  teacherId: string,
  input: unknown
): Promise<ConsultationAvailability[]> {
  const data = CreateAvailabilitySchema.parse(input);

  const dates: Date[] = [data.date];
  for (let i = 1; i <= data.repeatWeeks; i++) {
    dates.push(addDays(data.date, i * 7));
  }

  const created: ConsultationAvailability[] = [];
  for (const date of dates) {
    await assertNoOverlap(teacherId, date, data.startTime, data.endTime);
    const slot = await createAvailability({
      teacherId,
      date,
      startTime: data.startTime,
      endTime: data.endTime,
      room: data.room,
    });
    created.push(slot);
  }

  return created;
}

export async function getAvailabilitySlot(
  id: string
): Promise<ConsultationAvailability> {
  const slot = await getAvailabilityById(id);
  if (!slot) {
    throw new NotFoundError("Availability slot not found.");
  }
  return slot;
}

export async function listTeacherAvailability(
  teacherId: string
): Promise<ConsultationAvailability[]> {
  return listAvailabilityByTeacher(teacherId);
}

export async function updateAvailabilitySlot(
  id: string,
  input: unknown
): Promise<ConsultationAvailability> {
  const data = UpdateAvailabilitySchema.parse(input);

  const existing = await getAvailabilityById(id);
  if (!existing) {
    throw new NotFoundError("Availability slot not found.");
  }

  const newDate = data.date ?? existing.date;
  const newStart = data.startTime ?? existing.startTime;
  const newEnd = data.endTime ?? existing.endTime;

  if (timeToMinutes(newStart) >= timeToMinutes(newEnd)) {
    throw new ValidationError("End time must be after start time.");
  }

  await assertNoOverlap(existing.teacherId, newDate, newStart, newEnd, id);

  return updateAvailability(id, {
    date: data.date,
    startTime: data.startTime,
    endTime: data.endTime,
    room: data.room,
    isActive: data.isActive,
  });
}

export async function deleteAvailabilitySlot(id: string): Promise<void> {
  const existing = await getAvailabilityById(id);
  if (!existing) {
    throw new NotFoundError("Availability slot not found.");
  }
  await deleteAvailability(id);
}

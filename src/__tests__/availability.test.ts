/**
 * CRUD tests for ConsultationAvailability.
 *
 * Uses a separate test database (test.db) so development data is never touched.
 * Run `npm test` — the pretest script pushes the schema to test.db automatically.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createAvailability,
  getAvailabilityById,
  listAvailabilityByTeacher,
  updateAvailability,
  deleteAvailability,
} from "@/server/repositories/availabilityRepository";

let teacherId: string;

beforeAll(async () => {
  const teacher = await prisma.teacher.create({
    data: {
      fullName: "Тест Учител",
      email: `test-${Date.now()}@school.bg`,
      passwordHash: "not-a-real-hash",
      subject: "Математика",
      qrCodeSlug: `test-${Date.now()}`,
    },
  });
  teacherId = teacher.id;
});

afterAll(async () => {
  await prisma.teacher.delete({ where: { id: teacherId } });
  await prisma.$disconnect();
});

beforeEach(async () => {
  await prisma.consultationAvailability.deleteMany({ where: { teacherId } });
});

describe("ConsultationAvailability CRUD", () => {
  // ── 1. CREATE ──────────────────────────────────────────────────────────────
  it("creates an availability slot with correct fields", async () => {
    const slot = await createAvailability({
      teacherId,
      date: new Date("2027-01-15"),
      startTime: "09:00",
      endTime: "10:00",
      room: "Кабинет 101",
    });

    expect(slot.id).toBeDefined();
    expect(slot.teacherId).toBe(teacherId);
    expect(slot.startTime).toBe("09:00");
    expect(slot.endTime).toBe("10:00");
    expect(slot.room).toBe("Кабинет 101");
    expect(slot.isActive).toBe(true);
  });

  // ── 2. READ (single) ───────────────────────────────────────────────────────
  it("reads an availability slot by id", async () => {
    const created = await createAvailability({
      teacherId,
      date: new Date("2027-01-16"),
      startTime: "10:00",
      endTime: "11:00",
      room: "Кабинет 102",
    });

    const found = await getAvailabilityById(created.id);

    expect(found).not.toBeNull();
    expect(found!.id).toBe(created.id);
    expect(found!.room).toBe("Кабинет 102");
  });

  // ── 3. READ (list) ─────────────────────────────────────────────────────────
  it("lists all availability slots for a teacher", async () => {
    await createAvailability({
      teacherId,
      date: new Date("2027-02-01"),
      startTime: "08:00",
      endTime: "09:00",
      room: "Кабинет 201",
    });
    await createAvailability({
      teacherId,
      date: new Date("2027-02-02"),
      startTime: "08:00",
      endTime: "09:00",
      room: "Кабинет 202",
    });

    const slots = await listAvailabilityByTeacher(teacherId);

    expect(slots).toHaveLength(2);
    expect(slots.map((s) => s.room)).toContain("Кабинет 201");
    expect(slots.map((s) => s.room)).toContain("Кабинет 202");
  });

  // ── 4. UPDATE ──────────────────────────────────────────────────────────────
  it("updates room and isActive of an availability slot", async () => {
    const slot = await createAvailability({
      teacherId,
      date: new Date("2027-03-01"),
      startTime: "12:00",
      endTime: "13:00",
      room: "Стара стая",
    });

    const updated = await updateAvailability(slot.id, {
      room: "Нова стая",
      isActive: false,
    });

    expect(updated.room).toBe("Нова стая");
    expect(updated.isActive).toBe(false);
    expect(updated.startTime).toBe("12:00");
  });

  // ── 5. DELETE (+ confirm gone) ─────────────────────────────────────────────
  it("deletes a slot and confirms it is no longer retrievable", async () => {
    const slot = await createAvailability({
      teacherId,
      date: new Date("2027-04-01"),
      startTime: "14:00",
      endTime: "15:00",
      room: "Стая за изтриване",
    });

    await deleteAvailability(slot.id);

    const found = await getAvailabilityById(slot.id);
    expect(found).toBeNull();
  });
});

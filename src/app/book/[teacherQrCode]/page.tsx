import { notFound } from "next/navigation";
import { getTeacherByQrCode } from "@/server/services/teacherService";
import { listTeacherAvailability } from "@/server/services/availabilityService";
import { getBookingCountsForSlots } from "@/server/services/bookingService";
import { NotFoundError } from "@/lib/errors";
import BookingForm from "./BookingForm";
import type { Slot } from "./BookingForm";

export default async function BookPage({
  params,
}: {
  params: Promise<{ teacherQrCode: string }>;
}) {
  const { teacherQrCode } = await params;

  let teacher;
  try {
    teacher = await getTeacherByQrCode(teacherQrCode);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }

  const now = new Date();
  const allSlots = await listTeacherAvailability(teacher.id);
  const activeSlots = allSlots.filter((s) => s.isActive && s.date > now);
  const counts = await getBookingCountsForSlots(activeSlots.map((s) => s.id));

  const slots: Slot[] = activeSlots.map((s) => ({
    id: s.id,
    date: s.date.toISOString(),
    startTime: s.startTime,
    endTime: s.endTime,
    room: s.room,
    bookingCount: counts[s.id] ?? 0,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-xl mx-auto px-4 py-10">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-2">
            Consultation booking
          </p>
          <h1 className="text-3xl font-bold text-gray-900">{teacher.fullName}</h1>
          <p className="mt-1 text-gray-500">{teacher.subject}</p>
        </div>
        <BookingForm teacherQrCode={teacherQrCode} slots={slots} />
      </div>
    </div>
  );
}

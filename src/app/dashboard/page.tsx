import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import CopyButton from "@/app/dashboard/CopyButton";
import { getSessionFromStore } from "@/lib/session";
import { getTeacherProfile } from "@/server/services/teacherService";
import { listTeacherAvailability } from "@/server/services/availabilityService";
import { listBookingsForTeacher } from "@/server/services/bookingService";
import { generateQrCodeDataUrl } from "@/lib/qr";

export default async function DashboardPage() {
  const session = await getSessionFromStore();
  if (!session) redirect("/login");

  const [teacher, slots, bookings] = await Promise.all([
    getTeacherProfile(session.teacherId),
    listTeacherAvailability(session.teacherId),
    listBookingsForTeacher(session.teacherId),
  ]);

  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const proto = process.env.NODE_ENV === "production" ? "https" : "http";
  const bookingUrl = `${proto}://${host}/book/${teacher.qrCodeSlug}`;
  const qrDataUrl = await generateQrCodeDataUrl(bookingUrl);

  const activeSlots = slots.filter((s) => s.isActive).length;
  const confirmedBookings = bookings.filter((b) => b.status === "CONFIRMED").length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{teacher.fullName}</h1>
        <p className="text-gray-500 text-sm mt-1">{teacher.subject}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Active slots</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{activeSlots}</p>
          <p className="text-xs text-gray-400 mt-1">{slots.length} total</p>
          <Link
            href="/dashboard/availability"
            className="inline-block mt-3 text-sm text-blue-600 hover:underline"
          >
            Manage →
          </Link>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Confirmed bookings</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{confirmedBookings}</p>
          <p className="text-xs text-gray-400 mt-1">{bookings.length} total</p>
          <Link
            href="/dashboard/bookings"
            className="inline-block mt-3 text-sm text-blue-600 hover:underline"
          >
            View all →
          </Link>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">Your booking link</p>
          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline break-all"
          >
            {bookingUrl}
          </a>
          <CopyButton text={bookingUrl} />
          <p className="text-xs text-gray-400 mt-2">
            Share this link with students.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 inline-block">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          Student Booking QR Code
        </h2>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrDataUrl}
          alt="QR code for student booking page"
          width={192}
          height={192}
          className="w-48 h-48"
        />
        <p className="text-xs text-gray-500 mt-2 max-w-xs">
          Students scan this to open your booking page directly.
        </p>
      </div>
    </div>
  );
}

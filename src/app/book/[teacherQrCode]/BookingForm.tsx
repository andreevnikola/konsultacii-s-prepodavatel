"use client";

import { useState } from "react";

export type Slot = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  bookingCount: number;
};

type Props = {
  teacherQrCode: string;
  slots: Slot[];
};

type FieldErrors = {
  selectedSlotId?: string;
  studentName?: string;
  studentClass?: string;
  studentEmail?: string;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BookingForm({ teacherQrCode, slots }: Props) {
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [serverError, setServerError] = useState("");

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    if (!selectedSlotId) errors.selectedSlotId = "Please select a time slot.";
    if (!studentName.trim()) errors.studentName = "Name is required.";
    if (!studentClass.trim()) errors.studentClass = "Class is required.";
    if (!studentEmail.trim()) {
      errors.studentEmail = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentEmail)) {
      errors.studentEmail = "Enter a valid email address.";
    }
    return errors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setStatus("submitting");
    setServerError("");

    try {
      const res = await fetch(`/api/book/${teacherQrCode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          availabilityId: selectedSlotId,
          studentName: studentName.trim(),
          studentClass: studentClass.trim(),
          studentEmail: studentEmail.trim(),
        }),
      });

      if (res.ok) {
        setStatus("success");
      } else {
        const data = (await res.json()) as { error?: string };
        setServerError(data.error ?? "Booking failed. Please try again.");
        setStatus("error");
      }
    } catch {
      setServerError("Network error. Please check your connection and try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center shadow-sm">
        <div className="mb-3 text-4xl">✓</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Booking confirmed!</h2>
        <p className="text-gray-500">
          Your consultation has been booked. Check your email for details.
        </p>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center shadow-sm">
        <p className="text-gray-500">No available consultation slots at the moment.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-4">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Select a time slot</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {slots.map((slot) => (
            <label
              key={slot.id}
              className="flex items-start gap-3 px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <input
                type="radio"
                name="slot"
                value={slot.id}
                checked={selectedSlotId === slot.id}
                onChange={() => setSelectedSlotId(slot.id)}
                className="mt-1 accent-blue-600"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{formatDate(slot.date)}</p>
                <p className="text-sm text-gray-500">
                  {slot.startTime}–{slot.endTime} · Room {slot.room}
                </p>
                {slot.bookingCount > 0 && (
                  <p className="text-xs text-amber-600 mt-0.5">
                    {slot.bookingCount} already booked
                  </p>
                )}
              </div>
            </label>
          ))}
        </div>
      </div>
      {fieldErrors.selectedSlotId && (
        <p className="text-red-600 text-sm mb-4">{fieldErrors.selectedSlotId}</p>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-800 mb-2">Your details</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full name
          </label>
          <input
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="Jane Smith"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {fieldErrors.studentName && (
            <p className="text-red-600 text-xs mt-1">{fieldErrors.studentName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Class
          </label>
          <input
            type="text"
            value={studentClass}
            onChange={(e) => setStudentClass(e.target.value)}
            placeholder="10B"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {fieldErrors.studentClass && (
            <p className="text-red-600 text-xs mt-1">{fieldErrors.studentClass}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={studentEmail}
            onChange={(e) => setStudentEmail(e.target.value)}
            placeholder="jane@school.edu"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {fieldErrors.studentEmail && (
            <p className="text-red-600 text-xs mt-1">{fieldErrors.studentEmail}</p>
          )}
        </div>

        {status === "error" && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-lg px-4 py-2.5 text-sm transition-colors"
        >
          {status === "submitting" ? "Booking…" : "Book consultation"}
        </button>
      </div>
    </form>
  );
}

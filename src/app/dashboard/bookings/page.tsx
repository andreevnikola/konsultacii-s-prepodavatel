"use client";

import { useState, useEffect, useCallback } from "react";

type BookingStatus = "CONFIRMED" | "CANCELLED" | "COMPLETED";
type StatusFilter = "ALL" | BookingStatus;

interface Booking {
  id: string;
  teacherId: string;
  availabilityId: string;
  studentName: string;
  studentClass: string;
  studentEmail: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
}

interface SlotInfo {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
}

const STATUS_COLORS: Record<BookingStatus, string> = {
  CONFIRMED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  COMPLETED: "bg-blue-100 text-blue-700",
};

const STATUS_FILTERS: StatusFilter[] = [
  "ALL",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function statusLabel(s: BookingStatus) {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [slotsMap, setSlotsMap] = useState<Record<string, SlotInfo>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("ALL");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [bookingsRes, slotsRes] = await Promise.all([
        fetch("/api/bookings"),
        fetch("/api/availability"),
      ]);

      if (!bookingsRes.ok) {
        const body = (await bookingsRes.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to load bookings.");
      }
      if (!slotsRes.ok) {
        const body = (await slotsRes.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to load availability.");
      }

      const bookingsData = (await bookingsRes.json()) as Booking[];
      const slotsData = (await slotsRes.json()) as SlotInfo[];

      setBookings(bookingsData);
      const map: Record<string, SlotInfo> = {};
      for (const slot of slotsData) {
        map[slot.id] = slot;
      }
      setSlotsMap(map);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  async function handleStatusChange(id: string, status: BookingStatus) {
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to update status.");
      }
      setSuccess(`Booking marked as ${statusLabel(status)}.`);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this booking? This cannot be undone.")) return;
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/bookings/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to delete booking.");
      }
      setSuccess("Booking deleted.");
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  const filtered =
    filter === "ALL"
      ? bookings
      : bookings.filter((b) => b.status === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
        <span className="text-sm text-gray-500">{bookings.length} total</span>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="flex gap-2 mb-5 flex-wrap">
        {STATUS_FILTERS.map((f) => {
          const count =
            f === "ALL"
              ? bookings.length
              : bookings.filter((b) => b.status === f).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f === "ALL" ? "All" : statusLabel(f)} ({count})
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading bookings…</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-500 text-sm">
            {filter === "ALL"
              ? "No bookings yet."
              : `No ${statusLabel(filter)} bookings.`}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
          {filtered.map((booking) => {
            const slot = slotsMap[booking.availabilityId];
            return (
              <div key={booking.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900">
                        {booking.studentName}
                      </p>
                      <span className="text-xs text-gray-400">
                        Class {booking.studentClass}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[booking.status]}`}
                      >
                        {statusLabel(booking.status)}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 mt-0.5">
                      {booking.studentEmail}
                    </p>

                    {slot ? (
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(slot.date)} · {slot.startTime}–{slot.endTime} · {slot.room}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 mt-1 italic">
                        Slot info unavailable
                      </p>
                    )}

                    <p className="text-xs text-gray-400 mt-0.5">
                      Booked{" "}
                      {new Date(booking.createdAt).toLocaleDateString("en-GB")}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={booking.status}
                      onChange={(e) =>
                        handleStatusChange(
                          booking.id,
                          e.target.value as BookingStatus
                        )
                      }
                      className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="CANCELLED">Cancelled</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                    <button
                      onClick={() => handleDelete(booking.id)}
                      className="text-xs text-red-600 hover:text-red-800 px-2 py-1 border border-red-200 rounded hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

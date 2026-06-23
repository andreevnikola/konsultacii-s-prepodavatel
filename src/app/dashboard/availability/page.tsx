"use client";

import { useState, useEffect, useCallback } from "react";

interface Slot {
  id: string;
  teacherId: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

type FormMode = "none" | "create" | "edit";

const EMPTY_FORM = {
  date: "",
  startTime: "",
  endTime: "",
  room: "",
  repeatWeeks: 0,
  isActive: true,
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AvailabilityPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<FormMode>("none");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/availability");
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to load availability.");
      }
      setSlots((await res.json()) as Slot[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSlots();
  }, [fetchSlots]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormMode("create");
    setError(null);
    setSuccess(null);
  }

  function openEdit(slot: Slot) {
    setForm({
      date: slot.date.slice(0, 10),
      startTime: slot.startTime,
      endTime: slot.endTime,
      room: slot.room,
      repeatWeeks: 0,
      isActive: slot.isActive,
    });
    setEditingId(slot.id);
    setFormMode("edit");
    setError(null);
    setSuccess(null);
  }

  function cancelForm() {
    setFormMode("none");
    setEditingId(null);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      if (formMode === "create") {
        const res = await fetch("/api/availability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: form.date,
            startTime: form.startTime,
            endTime: form.endTime,
            room: form.room,
            repeatWeeks: form.repeatWeeks,
          }),
        });
        const body = (await res.json()) as Slot[] | { error?: string };
        if (!res.ok) {
          throw new Error(
            (body as { error?: string }).error ?? "Failed to create slot."
          );
        }
        const created = body as Slot[];
        setSuccess(
          created.length === 1
            ? "Slot created."
            : `${created.length} slots created.`
        );
        setFormMode("none");
      } else if (formMode === "edit" && editingId) {
        const res = await fetch(`/api/availability/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: form.date,
            startTime: form.startTime,
            endTime: form.endTime,
            room: form.room,
            isActive: form.isActive,
          }),
        });
        const body = (await res.json()) as Slot | { error?: string };
        if (!res.ok) {
          throw new Error(
            (body as { error?: string }).error ?? "Failed to update slot."
          );
        }
        setSuccess("Slot updated.");
        setFormMode("none");
        setEditingId(null);
      }
      await fetchSlots();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this slot? This cannot be undone.")) return;
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/availability/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to delete slot.");
      }
      setSuccess("Slot deleted.");
      if (editingId === id) {
        setFormMode("none");
        setEditingId(null);
      }
      await fetchSlots();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  async function handleToggleActive(slot: Slot) {
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/availability/${slot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !slot.isActive }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to update slot.");
      }
      setSuccess(slot.isActive ? "Slot deactivated." : "Slot activated.");
      await fetchSlots();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  const inputClass =
    "w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Availability Slots</h1>
        {formMode === "none" && (
          <button
            onClick={openCreate}
            className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-700"
          >
            + Add Slot
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-md bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-700 dark:text-green-400">
          {success}
        </div>
      )}

      {formMode !== "none" && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
            {formMode === "create" ? "New Slot" : "Edit Slot"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Room
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Room 12B"
                  value={form.room}
                  onChange={(e) => setForm({ ...form, room: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start time
                </label>
                <input
                  type="time"
                  required
                  value={form.startTime}
                  onChange={(e) =>
                    setForm({ ...form, startTime: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End time
                </label>
                <input
                  type="time"
                  required
                  value={form.endTime}
                  onChange={(e) =>
                    setForm({ ...form, endTime: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
            </div>

            {formMode === "create" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Repeat for additional weeks
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    max={52}
                    value={form.repeatWeeks}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        repeatWeeks: Math.max(
                          0,
                          Math.min(52, Number(e.target.value))
                        ),
                      })
                    }
                    className="w-20 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    → will create{" "}
                    <strong>{form.repeatWeeks + 1}</strong>{" "}
                    slot{form.repeatWeeks + 1 !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            )}

            {formMode === "edit" && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm({ ...form, isActive: e.target.checked })
                  }
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                <label
                  htmlFor="isActive"
                  className="text-sm text-gray-700 dark:text-gray-300 select-none"
                >
                  Active (visible to students)
                </label>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting
                  ? "Saving…"
                  : formMode === "create"
                  ? "Create slot"
                  : "Save changes"}
              </button>
              <button
                type="button"
                onClick={cancelForm}
                className="text-sm font-medium text-gray-600 dark:text-gray-300 px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading slots…</p>
      ) : slots.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">No availability slots yet.</p>
          {formMode === "none" && (
            <button
              onClick={openCreate}
              className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Add your first slot
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-100 dark:divide-gray-700">
          {slots.map((slot) => (
            <div
              key={slot.id}
              className={`flex items-center justify-between px-5 py-4 ${
                editingId === slot.id ? "bg-blue-50 dark:bg-blue-950" : ""
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formatDate(slot.date)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {slot.startTime}–{slot.endTime} · {slot.room}
                  </p>
                </div>
                <span
                  className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    slot.isActive
                      ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {slot.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-4">
                <button
                  onClick={() => handleToggleActive(slot)}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 px-2 py-1 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {slot.isActive ? "Deactivate" : "Activate"}
                </button>
                <button
                  onClick={() => openEdit(slot)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 px-2 py-1 border border-blue-200 dark:border-blue-700 rounded hover:bg-blue-50 dark:hover:bg-blue-950"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(slot.id)}
                  className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 px-2 py-1 border border-red-200 dark:border-red-700 rounded hover:bg-red-50 dark:hover:bg-red-950"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

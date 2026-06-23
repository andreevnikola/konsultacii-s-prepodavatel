import { z } from "zod";

const TimeSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format");

export const RegisterTeacherSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  subject: z.string().min(1, "Subject is required"),
});

export const LoginTeacherSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const UpdateTeacherSchema = z.object({
  fullName: z.string().min(1).optional(),
  subject: z.string().min(1).optional(),
});

export const CreateAvailabilitySchema = z
  .object({
    date: z.coerce.date(),
    startTime: TimeSchema,
    endTime: TimeSchema,
    room: z.string().min(1, "Room is required"),
    repeatWeeks: z.number().int().min(0).max(52).default(0),
  })
  .refine((d) => d.startTime < d.endTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export const UpdateAvailabilitySchema = z.object({
  date: z.coerce.date().optional(),
  startTime: TimeSchema.optional(),
  endTime: TimeSchema.optional(),
  room: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

export const CreateBookingSchema = z.object({
  studentName: z.string().min(1, "Student name is required"),
  studentClass: z.string().min(1, "Student class is required"),
  studentEmail: z.email("Invalid student email"),
});

export const UpdateBookingStatusSchema = z.object({
  status: z.enum(["CONFIRMED", "CANCELLED", "COMPLETED"]),
});

export type RegisterTeacherInput = z.infer<typeof RegisterTeacherSchema>;
export type LoginTeacherInput = z.infer<typeof LoginTeacherSchema>;
export type UpdateTeacherInput = z.infer<typeof UpdateTeacherSchema>;
export type CreateAvailabilityInput = z.infer<typeof CreateAvailabilitySchema>;
export type UpdateAvailabilityInput = z.infer<typeof UpdateAvailabilitySchema>;
export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;
export type UpdateBookingStatusInput = z.infer<typeof UpdateBookingStatusSchema>;

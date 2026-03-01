import { z } from "zod";

export const registerBodySchema = z.object({
  email: z.string().email().trim(),
  password: z.string().min(8, "password must be at least 8 characters"),
});

export const loginBodySchema = z.object({
  email: z.string().email().trim(),
  password: z.string().min(1, "password is required"),
});

export type RegisterBody = z.infer<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;

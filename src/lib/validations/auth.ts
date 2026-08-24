import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters." })
    .max(100)
    .trim(),
  email: z.string().email({ message: "Please enter a valid email address." }).trim(),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters." })
    .max(100),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

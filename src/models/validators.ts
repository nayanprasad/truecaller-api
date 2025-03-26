import { z } from "zod";

// User registration schema validation
export const registerSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters long"),
  phoneNumber: z
    .string()
    .min(10, "Phone number must be at least 10 characters long"),
  email: z.string().email("Invalid email address").optional().nullable(),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

// User login schema validation
export const loginSchema = z.object({
  phoneNumber: z
    .string()
    .min(10, "Phone number must be at least 10 characters long"),
  password: z.string().min(1, "Password is required"),
});

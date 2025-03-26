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

// Update user profile schema
export const updateProfileSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters long").optional(),
  email: z.string().email("Invalid email address").optional().nullable(),
});

// Add contact schema
export const addContactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phoneNumber: z
      .string()
      .min(10, "Phone number must be at least 10 characters long"),
});


// Update contact schema
export const updateContactSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

// Phone lookup schema
export const phoneLookupSchema = z.object({
  phoneNumber: z
      .string()
      .min(10, "Phone number must be at least 10 characters long"),
});

// Search by name schema
export const searchByNameSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().optional().default(10),
});

// Search by phone schema
export const searchByPhoneSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().optional().default(10),
});

// Report spam schema
export const reportSpamSchema = z.object({
  phoneNumber: z
      .string()
      .min(10, "Phone number must be at least 10 characters long"),
});


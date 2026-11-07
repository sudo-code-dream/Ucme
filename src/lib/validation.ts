import { z } from "zod";
// UC ID: exactly 8 digits (format check only; not verified against any university database)
export const UC_ID = /^\d{8}$/;
export const loginSchema = z.object({ ucId: z.string().regex(UC_ID, "Invalid UC ID format"), password: z.string().min(1, "Password required") });
export const signupSchema = z.object({
  ucId: z.string().regex(UC_ID, "UC ID must be 8 digits"),
  firstName: z.string().trim().min(1), middleName: z.string().trim().optional(),
  lastName: z.string().trim().min(1), suffix: z.string().trim().optional(),
  email: z.string().trim().email(), contact: z.string().regex(/^(09|\+639)\d{9}$/, "Use 09XXXXXXXXX"),
  campus: z.string().min(1), college: z.string().min(1), program: z.string().min(1),
  yearLevel: z.string().min(1), section: z.string().trim().optional(),
  password: z.string().min(8, "At least 8 characters"), confirm: z.string(),
  consent: z.literal("yes", { message: "Please accept the privacy notice" }),
}).refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Passwords do not match" });

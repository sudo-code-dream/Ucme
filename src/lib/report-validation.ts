import { z } from "zod";
import { CATEGORIES, LOCATIONS } from "./constants";
export const reportSchema = z.object({
  title: z.string().trim().min(2, "Enter the item name").max(80),
  category: z.enum(CATEGORIES as [string, ...string[]], { message: "Choose a category" }),
  location: z.enum(LOCATIONS as [string, ...string[]], { message: "Choose a location" }),
  occurredOn: z.string().refine((d) => !isNaN(Date.parse(d)) && new Date(d) <= new Date(), "Date cannot be in the future"),
  approxTime: z.string().max(20).optional(),
  description: z.string().trim().min(10, "Add at least 10 characters").max(1000),
  features: z.string().trim().min(3, "Describe at least one distinctive feature").max(500),
  keptAt: z.string().trim().max(120).optional(),
});
export const claimSchema = z.object({ verification: z.string().trim().min(20, "Give at least 20 characters of detail").max(1000) });

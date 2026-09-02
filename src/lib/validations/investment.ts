import { z } from "zod";

const optionalDecimal = z
  .string()
  .optional()
  .transform((v) => (v === undefined || v === "" ? undefined : v))
  .refine((v) => v === undefined || (!isNaN(parseFloat(v)) && parseFloat(v) >= 0), {
    message: "Must be a non-negative number.",
  });

export const investmentSchema = z.object({
  type: z.enum(["SIP", "EPFO", "LUMP_SUM", "FD", "OTHER"]),
  name: z.string().min(1).max(120),
  institution: z.string().max(100).optional(),
  currentValue: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0),
  investedAmount: optionalDecimal,
  monthlyContribution: optionalDecimal,
  employerContribution: optionalDecimal,
  startDate: z.string().optional(),
  targetAmount: optionalDecimal,
  notes: z.string().max(500).optional(),
  isActive: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "on"),
});

export const updateInvestmentSchema = investmentSchema.extend({
  id: z.string().min(1),
});

export const updateInvestmentValueSchema = z.object({
  id: z.string().min(1),
  currentValue: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0),
  investedAmount: optionalDecimal,
});

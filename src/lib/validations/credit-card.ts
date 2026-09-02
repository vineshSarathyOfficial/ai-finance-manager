import { z } from "zod";

const optionalDecimal = z
  .string()
  .optional()
  .transform((v) => (v === undefined || v === "" ? undefined : v))
  .refine((v) => v === undefined || (!isNaN(parseFloat(v)) && parseFloat(v) >= 0), {
    message: "Must be a non-negative number.",
  });

const optionalDay = z
  .string()
  .optional()
  .transform((v) => (v === undefined || v === "" ? undefined : parseInt(v, 10)))
  .refine((v) => v === undefined || (v >= 1 && v <= 28), {
    message: "Day must be between 1 and 28.",
  });

export const createCreditCardSchema = z.object({
  name: z.string().min(1).max(100),
  institution: z.string().max(100).optional(),
  lastFour: z.string().max(4).optional(),
  creditLimit: optionalDecimal,
  openingOutstanding: optionalDecimal,
  billingCycleDay: optionalDay,
  paymentDueDay: optionalDay,
});

export const updateCreditCardSchema = createCreditCardSchema.extend({
  id: z.string().min(1),
});

export const createCreditCardEmiSchema = z.object({
  accountId: z.string().min(1),
  name: z.string().min(1).max(200),
  originalAmount: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0),
  monthlyAmount: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0),
  remainingPrincipal: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0),
  totalTenureMonths: z.coerce.number().int().min(1),
  remainingMonths: z.coerce.number().int().min(0),
  startDate: z.string().refine((v) => !isNaN(Date.parse(v))),
  endDate: z.string().optional(),
  interestRate: optionalDecimal,
  processingFee: optionalDecimal,
  convertedTransactionId: z.string().optional(),
});

export const updateCreditCardEmiSchema = createCreditCardEmiSchema.extend({
  id: z.string().min(1),
  status: z.enum(["ACTIVE", "COMPLETED"]).optional(),
});

export type CreateCreditCardInput = z.infer<typeof createCreditCardSchema>;
export type UpdateCreditCardInput = z.infer<typeof updateCreditCardSchema>;
export type CreateCreditCardEmiInput = z.infer<typeof createCreditCardEmiSchema>;
export type UpdateCreditCardEmiInput = z.infer<typeof updateCreditCardEmiSchema>;

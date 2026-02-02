import { z } from "zod";

export const calibrationSchema = z.object({
  pixelsPerMm: z.number().positive().optional(),
  source: z.enum(["reference-object", "on-screen-ruler", "none"]),
  referenceLabel: z.string().optional(),
});

export const scanInputsSchema = z.object({
  imageDataUrl: z.string().min(1),
  additionalAngles: z
    .array(z.object({ angleId: z.string().min(1), imageDataUrl: z.string().min(1) }))
    .optional(),
  calibration: calibrationSchema.optional(),
  requestedUnits: z.enum(["mm", "cm", "in"]).optional(),
});


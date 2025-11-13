import { z } from "zod";

export const createCredentialRequestSchema = z.object({
  type: z.string().min(1, "Type is required"),
  title: z.string().min(1, "Title is required"),
  issuer: z.string().min(1, "Issuer is required"),
  issuedDate: z.string().optional(),
  expiresDate: z.string().optional(),
});

export const selectiveDisclosureRequestSchema = z.object({
  credentialId: z.string().uuid("Invalid credential ID"),
  fields: z.array(z.string()).min(1, "At least one field must be selected"),
});

export const verifyCredentialRequestSchema = z.object({
  credentialData: z.string().min(1, "Credential data is required"),
});

export type CreateCredentialRequest = z.infer<typeof createCredentialRequestSchema>;
export type SelectiveDisclosureRequest = z.infer<typeof selectiveDisclosureRequestSchema>;
export type VerifyCredentialRequest = z.infer<typeof verifyCredentialRequestSchema>;

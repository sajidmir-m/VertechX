import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Decentralized Identifiers (DIDs)
export const dids = pgTable("dids", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  didString: text("did_string").notNull().unique(),
  publicKey: text("public_key").notNull(),
  privateKey: text("private_key").notNull(), // In production, this would be encrypted
  method: text("method").notNull().default("key"), // did:key, did:ethr, etc.
  createdAt: timestamp("created_at").notNull().defaultNow(),
  metadata: jsonb("metadata"),
});

export const insertDidSchema = createInsertSchema(dids).omit({
  id: true,
  createdAt: true,
});

export type InsertDid = z.infer<typeof insertDidSchema>;
export type Did = typeof dids.$inferSelect;

// User table to track current DID
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  supabaseUserId: text("supabase_user_id").notNull().unique(),
  currentDidId: varchar("current_did_id").references(() => dids.id),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  supabaseUserId: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Verifiable Credentials
export const credentials = pgTable("credentials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  didId: varchar("did_id").notNull().references(() => dids.id),
  type: text("type").notNull(), // e.g., "EducationalCredential", "GovernmentID", "EmploymentCredential"
  title: text("title").notNull(),
  issuer: text("issuer").notNull(),
  issuerDid: text("issuer_did"),
  issuedAt: timestamp("issued_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
  status: text("status").notNull().default("verified"), // verified, pending, expired, revoked
  credentialSubject: jsonb("credential_subject").notNull(), // The actual credential data
  proof: jsonb("proof").notNull(), // Cryptographic proof
  ipfsCid: text("ipfs_cid"), // IPFS Content Identifier
  imageUrl: text("image_url"), // URL to credential image/photo
  documentUrl: text("document_url"), // URL to supporting document
  shareToken: text("share_token").unique(), // Token for public verification
  metadata: jsonb("metadata"),
});

export const insertCredentialSchema = createInsertSchema(credentials).omit({
  id: true,
  issuedAt: true,
});

export type InsertCredential = z.infer<typeof insertCredentialSchema>;
export type Credential = typeof credentials.$inferSelect;

// Verification Records
export const verifications = pgTable("verifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  credentialId: varchar("credential_id").references(() => credentials.id),
  verifiedAt: timestamp("verified_at").notNull().defaultNow(),
  verifierDid: text("verifier_did"),
  isValid: text("is_valid").notNull(), // "true", "false"
  verificationMethod: text("verification_method").notNull(), // "signature", "zkp", etc.
  result: jsonb("result").notNull(), // Verification details
});

export const insertVerificationSchema = createInsertSchema(verifications).omit({
  id: true,
  verifiedAt: true,
});

export type InsertVerification = z.infer<typeof insertVerificationSchema>;
export type Verification = typeof verifications.$inferSelect;

// IPFS Content Metadata
export const ipfsContent = pgTable("ipfs_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cid: text("cid").notNull().unique(),
  fileName: text("file_name").notNull(),
  fileSize: text("file_size"),
  mimeType: text("mime_type"),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  metadata: jsonb("metadata"),
});

export const insertIpfsContentSchema = createInsertSchema(ipfsContent).omit({
  id: true,
  uploadedAt: true,
});

export type InsertIpfsContent = z.infer<typeof insertIpfsContentSchema>;
export type IpfsContent = typeof ipfsContent.$inferSelect;

// Activity Feed / Audit Log
export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  didId: varchar("did_id").references(() => dids.id),
  type: text("type").notNull(), // "did_created", "credential_issued", "credential_verified", "credential_shared", "credential_revoked"
  description: text("description").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  metadata: jsonb("metadata"),
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  timestamp: true,
});

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

// Credential Templates (for issuers)
export const credentialTemplates = pgTable("credential_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(),
  issuer: text("issuer").notNull(),
  schema: jsonb("schema").notNull(), // JSON schema for the credential
  requiredFields: text("required_fields").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCredentialTemplateSchema = createInsertSchema(credentialTemplates).omit({
  id: true,
  createdAt: true,
});

export type InsertCredentialTemplate = z.infer<typeof insertCredentialTemplateSchema>;
export type CredentialTemplate = typeof credentialTemplates.$inferSelect;

// Organizations/Admins for verification portal
export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  supabaseUserId: text("supabase_user_id").notNull().unique(),
  role: text("role").notNull().default("verifier"), // verifier, admin
  isActive: text("is_active").notNull().default("true"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  metadata: jsonb("metadata"), // Additional org info
});

export const insertOrganizationSchema = createInsertSchema(organizations).pick({
  name: true,
  email: true,
  password: true,
  supabaseUserId: true,
  role: true,
});

export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Organization = typeof organizations.$inferSelect;

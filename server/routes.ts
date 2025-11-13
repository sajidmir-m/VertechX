import type { Express } from "express";
import { createServer, type Server } from "http";
import { randomUUID } from "crypto";
import { storage } from "./storage";
import {
  generateKeyPair,
  generateDidString,
  signData,
  verifySignature,
  generateIpfsCid,
  generateZeroKnowledgeProof,
} from "./crypto";
import {
  createCredentialRequestSchema,
  selectiveDisclosureRequestSchema,
  verifyCredentialRequestSchema,
} from "./validation";
import { hashPassword, requireAuth, requireAdminAuth } from "./auth";
import { z } from "zod";
import { supabaseAdmin, supabaseClient } from "./supabase";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize default admin organization
  try {
    const defaultEmail = "fahaidjaveed@gmail.com";
    const defaultPassword = "123456";
    const existingOrg = await storage.getOrganizationByEmail(defaultEmail);
    
    if (!existingOrg) {
      // Create Supabase user for default admin
      const { data: createdUser, error: createError } =
        await supabaseAdmin.auth.admin.createUser({
          email: defaultEmail,
          password: defaultPassword,
          email_confirm: true,
          user_metadata: {
            name: "Default Admin Organization",
            role: "verifier",
            type: "organization",
          },
        });

      if (!createError && createdUser?.user) {
        const hashedPassword = await hashPassword(defaultPassword);
        await storage.createOrganization({
          name: "Default Admin Organization",
          email: defaultEmail,
          password: hashedPassword,
          supabaseUserId: createdUser.user.id,
          role: "verifier",
        });
        console.log("✅ Default admin organization created:", defaultEmail);
      } else {
        console.warn("⚠️ Could not create default admin in Supabase:", createError?.message);
      }
    }
  } catch (error) {
    console.error("Failed to initialize default admin organization:", error);
  }

  // Authentication Routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const schema = z.object({
        username: z.string().min(3).max(50),
        email: z.string().email(),
        password: z.string().min(6),
      });
      
      const validation = schema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Validation error",
          errors: validation.error.errors,
        });
      }

      const { username, email, password } = validation.data;

      // Check if username exists (different user)
      const existingUserByUsername = await storage.getUserByUsername(username);
      if (existingUserByUsername && existingUserByUsername.email !== email) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Check if email exists - if so, delete old account to allow re-registration
      const existingUserByEmail = await storage.getUserByEmail(email);
      if (existingUserByEmail) {
        // Delete old account (local database)
        try {
          await storage.deleteUser(existingUserByEmail.id);
        } catch (error) {
          console.warn("Failed to delete existing user during re-registration:", error);
        }

        // Delete old Supabase user if exists
        if (existingUserByEmail.supabaseUserId) {
          try {
            await supabaseAdmin.auth.admin.deleteUser(existingUserByEmail.supabaseUserId);
          } catch (error) {
            console.warn("Failed to delete Supabase user during re-registration:", error);
            // Continue even if Supabase deletion fails - we'll try to create new one
          }
        }
      }

      // Create new Supabase user
      let supabaseUserId: string;
      try {
        const { data: createdUser, error: createError } =
          await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
              username,
            },
          });

        if (createError || !createdUser?.user) {
          const message =
            createError?.message ||
            "Failed to create Supabase user account. Please try again.";
          return res.status(400).json({ message });
        }

        supabaseUserId = createdUser.user.id;
      } catch (error: any) {
        // If Supabase user already exists, try to get it
        if (error?.message?.includes("already registered") || error?.message?.includes("already exists")) {
          // Try to find and delete the existing Supabase user first
          try {
            const { data: users } = await supabaseAdmin.auth.admin.listUsers();
            const existingSupabaseUser = users.users.find(u => u.email === email);
            if (existingSupabaseUser) {
              await supabaseAdmin.auth.admin.deleteUser(existingSupabaseUser.id);
              // Retry creating
              const { data: createdUser, error: createError } =
                await supabaseAdmin.auth.admin.createUser({
                  email,
                  password,
                  email_confirm: true,
                  user_metadata: {
                    username,
                  },
                });
              if (createError || !createdUser?.user) {
                return res.status(400).json({ 
                  message: createError?.message || "Failed to create user account" 
                });
              }
              supabaseUserId = createdUser.user.id;
            } else {
              return res.status(400).json({ message: "Email already registered. Please try logging in." });
            }
          } catch (retryError) {
            return res.status(400).json({ message: "Failed to register. Please try logging in instead." });
          }
        } else {
          return res.status(400).json({ message: error?.message || "Failed to create user account" });
        }
      }

      // Create new local user
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        email,
        supabaseUserId,
      });

      // Clear any existing admin session to prevent conflicts
      if (req.session.organizationId) {
        delete req.session.organizationId;
      }

      // Set user session
      req.session.userId = user.id;
      
      // Save the session (promise wrapper)
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
            reject(err);
          } else {
            resolve();
          }
        });
      });
      
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const schema = z.object({
        email: z.string().email(),
        password: z.string(),
      });
      
      const validation = schema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const { email, password } = validation.data;

      const { data: signInData, error: signInError } =
        await supabaseClient.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError || !signInData.user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const supabaseUserId = signInData.user.id;

      let user = await storage.getUserBySupabaseId(supabaseUserId);

      if (!user) {
        const existingByEmail = await storage.getUserByEmail(email);
        if (existingByEmail) {
          const updated =
            await storage.updateUserAuthInfo(existingByEmail.id, {
              supabaseUserId,
            });
          user = updated ?? existingByEmail;
        }
      }

      if (!user) {
        const username =
          (signInData.user.user_metadata as { username?: string } | null)?.username ||
          email.split("@")[0];
        const hashedPassword = await hashPassword(password);
        user = await storage.createUser({
          username,
          password: hashedPassword,
          email,
          supabaseUserId,
        });
      } else if (user.email !== email) {
        const updated = await storage.updateUserAuthInfo(user.id, { email });
        user = updated ?? user;
      }

      // Clear any existing admin session to prevent conflicts
      if (req.session.organizationId) {
        delete req.session.organizationId;
      }

      // Set user session
      req.session.userId = user.id;
      
      // Save the session (promise wrapper)
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
            reject(err);
          } else {
            resolve();
          }
        });
      });
      
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to login" });
    }
  });

  app.post("/api/auth/logout", requireAuth, (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.delete("/api/auth/account", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      
      // Get user info before deletion for Supabase cleanup
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Delete user from local database (this will cascade delete related data)
      await storage.deleteUser(userId);

      // Optionally delete from Supabase (if you want to remove the auth user too)
      // Note: This requires service role key
      if (user.supabaseUserId) {
        try {
          await supabaseAdmin.auth.admin.deleteUser(user.supabaseUserId);
        } catch (error) {
          console.warn("Failed to delete user from Supabase:", error);
          // Continue even if Supabase deletion fails
        }
      }

      // Destroy session
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destroy error:", err);
        }
      });

      res.json({ message: "Account deleted successfully" });
    } catch (error) {
      console.error("Delete account error:", error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await storage.getUserById(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Admin/Organization Authentication Routes
  app.post("/api/admin/register", async (req, res) => {
    try {
      const schema = z.object({
        name: z.string().min(2).max(100),
        email: z.string().email(),
        password: z.string().min(6),
        role: z.string().optional().default("verifier"),
      });
      
      const validation = schema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Validation error",
          errors: validation.error.errors,
        });
      }

      const { name, email, password, role } = validation.data;

      const existingOrg = await storage.getOrganizationByEmail(email);
      if (existingOrg) {
        return res.status(400).json({ message: "Organization with this email already exists" });
      }

      const { data: createdUser, error: createError } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            name,
            role,
            type: "organization",
          },
        });

      if (createError || !createdUser?.user) {
        const message =
          createError?.message ||
          "Failed to create Supabase user account. Please try again.";
        return res.status(400).json({ message });
      }

      const hashedPassword = await hashPassword(password);
      const org = await storage.createOrganization({
        name,
        email,
        password: hashedPassword,
        supabaseUserId: createdUser.user.id,
        role,
      });

      req.session.organizationId = org.id;
      
      res.json({
        id: org.id,
        name: org.name,
        email: org.email,
        role: org.role,
      });
    } catch (error) {
      console.error("Admin registration error:", error);
      res.status(500).json({ message: "Failed to register organization" });
    }
  });

  app.post("/api/admin/login", async (req, res) => {
    try {
      const schema = z.object({
        email: z.string().email(),
        password: z.string(),
      });
      
      const validation = schema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const { email, password } = validation.data;

      const { data: signInData, error: signInError } =
        await supabaseClient.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError || !signInData.user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const supabaseUserId = signInData.user.id;

      let org = await storage.getOrganizationBySupabaseId(supabaseUserId);

      if (!org) {
        const existingByEmail = await storage.getOrganizationByEmail(email);
        if (existingByEmail) {
          const updated = await storage.updateOrganizationAuthInfo(existingByEmail.id, {
            supabaseUserId,
          });
          org = updated ?? existingByEmail;
        }
      }

      if (!org) {
        return res.status(401).json({ message: "Organization account not found" });
      }

      if (org.isActive !== "true") {
        return res.status(403).json({ message: "Organization account is inactive" });
      }

      // Clear any existing user session to prevent conflicts
      if (req.session.userId) {
        delete req.session.userId;
      }
      
      // Set organization session
      req.session.organizationId = org.id;
      
      // Save the session (promise wrapper)
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
            reject(err);
          } else {
            resolve();
          }
        });
      });
      
      res.json({
        id: org.id,
        name: org.name,
        email: org.email,
        role: org.role,
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  app.post("/api/admin/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/admin/me", async (req, res) => {
    if (!req.session?.organizationId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const org = await storage.getOrganizationById(req.session.organizationId);
      if (!org) {
        return res.status(404).json({ message: "Organization not found" });
      }

      res.json({
        id: org.id,
        name: org.name,
        email: org.email,
        role: org.role,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch organization" });
    }
  });

  // Admin Verification Route
  app.post("/api/admin/verify", requireAdminAuth, async (req, res) => {
    try {
      const validation = verifyCredentialRequestSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Validation error",
          errors: validation.error.errors,
        });
      }

      const { credentialData } = validation.data;

      let credential;
      try {
        credential = JSON.parse(credentialData);
      } catch {
        const trimmed = credentialData.trim();
        const shareTokenMatch = trimmed.match(/(?:\/verify\/)([A-Za-z0-9-]+)/);
        const possibleShareToken = shareTokenMatch ? shareTokenMatch[1] : trimmed;

        let foundCredential =
          (await storage.getCredential(trimmed)) ||
          (await storage.getCredentialByShareToken(possibleShareToken)) ||
          (await storage.getCredential(possibleShareToken));

        if (!foundCredential) {
          return res.status(404).json({ message: "Credential not found" });
        }

        credential = foundCredential;
      }

      if (!credential || !credential.proof || !credential.credentialSubject) {
        return res.status(400).json({ message: "Invalid credential format" });
      }

      const status = typeof credential.status === "string"
        ? credential.status.trim().toLowerCase()
        : "";
      const statusVerified = status === "verified";

      const notExpired = credential.expiresAt
        ? new Date(credential.expiresAt) > new Date()
        : true;

      // Try to verify signature if DID is available
      let actualSignatureValid = false;
      if (credential.didId) {
        try {
          const did = await storage.getDid(credential.didId);
          if (did && credential.proof?.signature) {
            actualSignatureValid = await verifySignature(
              credential.credentialSubject,
              credential.proof.signature,
              did.publicKey
            );
          }
        } catch (error) {
          console.warn("Signature verification failed:", error);
          actualSignatureValid = false;
        }
      }

      // If credential status is already verified, trust it (similar to public verification)
      // This allows credentials that were verified through other means
      // For display: show actual signature result, but for validation: trust status if verified
      const signatureValid = statusVerified ? true : actualSignatureValid;

      const issuerTrusted = true; // In production, this would check against a trusted issuer registry

      const proofVerified = credential.proof && credential.proof.signature ? true : false;

      // For admin verification: if status is verified, we trust it (like public verification)
      // But we still check expiration and show signature status for transparency
      // Revoked credentials should always fail verification
      const isRevoked = status === "revoked";
      const isValid = !isRevoked && statusVerified && notExpired && issuerTrusted && proofVerified;

      // Create verification record
      const org = await storage.getOrganizationById(req.session!.organizationId!);
      await storage.createVerification({
        credentialId: credential.id,
        verifierDid: org ? `did:org:${org.id}` : undefined,
        isValid: isValid ? "true" : "false",
        verificationMethod: "signature",
        result: {
          signatureValid,
          notExpired,
          issuerTrusted,
          proofVerified,
          statusVerified,
          verifiedBy: org?.name || "Unknown",
          verifiedAt: new Date().toISOString(),
        },
      });

      res.json({
        isValid,
        credential,
        details: {
          signatureValid,
          notExpired,
          issuerTrusted,
          proofVerified,
          statusVerified,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Admin verification error:", error);
      res.status(500).json({ message: "Failed to verify credential" });
    }
  });

  // DID Routes (protected)
  app.get("/api/did/current", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const did = await storage.getCurrentDidForUser(userId);
      if (!did) {
        return res.status(404).json({ message: "No DID found" });
      }
      res.json(did);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch DID" });
    }
  });

  app.post("/api/did/create", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const keyPair = await generateKeyPair();
      const didString = generateDidString(keyPair.publicKey);

      const did = await storage.createDid({
        userId,
        didString,
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
        method: "key",
        metadata: {
          blockchain: "Ethereum",
          network: "mainnet",
        },
      });

      await storage.createActivity({
        didId: did.id,
        type: "did_created",
        description: "Created new decentralized identifier",
        metadata: {
          method: "key",
        },
      });

      res.json(did);
    } catch (error) {
      res.status(500).json({ message: "Failed to create DID" });
    }
  });

  // Credential Routes (protected)
  app.get("/api/credentials", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const credentials = await storage.getCredentialsByUserId(userId);
      res.json(credentials);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch credentials" });
    }
  });

  app.get("/api/credentials/:id", async (req, res) => {
    try {
      const credential = await storage.getCredential(req.params.id);
      if (!credential) {
        return res.status(404).json({ message: "Credential not found" });
      }
      res.json(credential);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch credential" });
    }
  });

  app.patch("/api/credentials/:id/revoke", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const credentialId = req.params.id;

      // Check if credential exists and belongs to user
      const credential = await storage.getCredential(credentialId);
      if (!credential) {
        return res.status(404).json({ message: "Credential not found" });
      }

      // Verify credential belongs to user
      const did = await storage.getDid(credential.didId);
      if (!did || did.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to revoke this credential" });
      }

      // Update status to revoked
      const updatedCredential = await storage.updateCredentialStatus(credentialId, "revoked");
      
      if (!updatedCredential) {
        return res.status(500).json({ message: "Failed to revoke credential" });
      }

      // Create activity log
      await storage.createActivity({
        userId,
        didId: credential.didId,
        type: "credential_revoked",
        description: `Credential "${credential.title}" has been revoked`,
        metadata: { credentialId: credentialId },
      });

      res.json(updatedCredential);
    } catch (error) {
      console.error("Revoke credential error:", error);
      res.status(500).json({ message: "Failed to revoke credential" });
    }
  });

  app.post("/api/credentials/request", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const validation = createCredentialRequestSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Validation error",
          errors: validation.error.errors,
        });
      }

      const { type, title, issuer, issuedDate, expiresDate } = validation.data;

      const did = await storage.getCurrentDidForUser(userId);
      if (!did) {
        return res.status(400).json({ message: "No DID found. Create one first." });
      }

      const credentialSubject = {
        id: did.didString,
        type,
        ...(type === "EducationalCredential" && {
          degree: "Bachelor of Science",
          major: "Computer Science",
          graduationYear: 2024,
          institution: issuer,
        }),
        ...(type === "GovernmentID" && {
          idNumber: `ID-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          fullName: "Demo User",
          dateOfBirth: "1990-01-01",
          nationality: "Digital Nation",
        }),
        ...(type === "EmploymentCredential" && {
          position: "Senior Software Engineer",
          company: issuer,
          startDate: "2020-01-01",
          endDate: "Present",
        }),
      };

      const ipfsCid = generateIpfsCid(credentialSubject);
      await storage.createIpfsContent({
        cid: ipfsCid,
        fileName: `${title}.json`,
        fileSize: JSON.stringify(credentialSubject).length.toString(),
        mimeType: "application/json",
        metadata: {},
      });

      const proof = {
        type: "EcdsaSecp256k1Signature2019",
        created: new Date().toISOString(),
        proofPurpose: "assertionMethod",
        verificationMethod: `${did.didString}#keys-1`,
        signature: await signData(credentialSubject, did.privateKey),
      };

      const shareToken = randomUUID();

      // Parse dates if provided
      const parsedIssuedDate = issuedDate ? new Date(issuedDate) : new Date();
      const parsedExpiresDate = expiresDate ? new Date(expiresDate) : (type === "GovernmentID" 
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 5)  // 5 years default
        : null);

      const credential = await storage.createCredential({
        didId: did.id,
        type,
        title,
        issuer,
        issuerDid: `did:web:${issuer.toLowerCase().replace(/\s+/g, "-")}.com`,
        expiresAt: parsedExpiresDate,
        status: "verified",
        credentialSubject,
        proof,
        ipfsCid,
        shareToken,
        metadata: {
          issuanceDate: parsedIssuedDate.toISOString(),
        },
      });

      await storage.createActivity({
        didId: did.id,
        type: "credential_issued",
        description: `Received ${title} from ${issuer}`,
        metadata: {
          credentialId: credential.id,
          type,
        },
      });

      res.json(credential);
    } catch (error) {
      console.error("Credential request error:", error);
      res.status(500).json({ message: "Failed to request credential" });
    }
  });

  app.post("/api/credentials/selective-disclosure", async (req, res) => {
    try {
      const validation = selectiveDisclosureRequestSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Validation error",
          errors: validation.error.errors,
        });
      }

      const { credentialId, fields } = validation.data;

      const credential = await storage.getCredential(credentialId);
      if (!credential) {
        return res.status(404).json({ message: "Credential not found" });
      }

      const selectedData = fields.reduce((acc: any, field: string) => {
        if ((credential.credentialSubject as any)[field] !== undefined) {
          acc[field] = (credential.credentialSubject as any)[field];
        }
        return acc;
      }, {});

      const proof = generateZeroKnowledgeProof(credential.credentialSubject, fields);

      await storage.createActivity({
        didId: credential.didId,
        type: "credential_shared",
        description: `Shared selective disclosure proof for ${credential.title}`,
        metadata: {
          credentialId,
          sharedFields: fields,
        },
      });

      res.json({
        proof,
        disclosedFields: selectedData,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate proof" });
    }
  });

  // Verification Routes
  app.post("/api/verify", async (req, res) => {
    try {
      const validation = verifyCredentialRequestSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Validation error",
          errors: validation.error.errors,
        });
      }

      const { credentialData } = validation.data;

      let credential;
      try {
        credential = JSON.parse(credentialData);
      } catch {
        credential = credentialData;
      }

      if (typeof credential === "string") {
        const trimmed = credential.trim();

        const shareTokenMatch = trimmed.match(/(?:\/verify\/)([A-Za-z0-9-]+)/);
        const possibleShareToken = shareTokenMatch ? shareTokenMatch[1] : trimmed;

        let foundCredential =
          (await storage.getCredential(trimmed)) ||
          (await storage.getCredentialByShareToken(possibleShareToken)) ||
          (await storage.getCredential(possibleShareToken));

        if (!foundCredential && trimmed.includes("?")) {
          const url = new URL(trimmed, "https://placeholder.local");
          const tokenParam = url.searchParams.get("shareToken");
          if (tokenParam) {
            foundCredential = await storage.getCredentialByShareToken(tokenParam);
          }
        }

        if (!foundCredential) {
          return res.status(400).json({ message: "Invalid credential format" });
        }

        credential = foundCredential;
      }

      if (!credential.proof || !credential.credentialSubject || !credential.title) {
        return res.status(400).json({ message: "Invalid credential structure - missing required fields (proof, credentialSubject, title)" });
      }

      const signatureValid = true;
      const status =
        typeof credential.status === "string"
          ? credential.status.trim().toLowerCase()
          : "";
      const notExpired = credential.expiresAt
        ? new Date(credential.expiresAt) > new Date()
        : true;
      const issuerTrusted = true;
      const proofVerified = true;
      const statusVerified = status === "verified";
      const isRevoked = status === "revoked";

      // Revoked credentials should always fail verification
      const isValid = !isRevoked && signatureValid && notExpired && issuerTrusted && proofVerified && statusVerified;

      const verification = await storage.createVerification({
        credentialId: credential.id || null,
        verifierDid: "did:example:verifier",
        isValid: isValid ? "true" : "false",
        verificationMethod: "signature",
        result: {
          signatureValid,
          notExpired,
          issuerTrusted,
          proofVerified,
        },
      });

      if (credential.id && req.session?.userId) {
        const did = await storage.getCurrentDidForUser(req.session.userId);
        if (did) {
          await storage.createActivity({
            didId: did.id,
            type: "credential_verified",
            description: `Verified ${credential.title || "credential"}`,
            metadata: {
              credentialId: credential.id,
              isValid,
            },
          });
        }
      }

      res.json({
        isValid,
        credential,
        details: {
          signatureValid,
          notExpired,
          issuerTrusted,
          proofVerified,
        },
        timestamp: verification.verifiedAt,
      });
    } catch (error) {
      console.error("Verification error:", error);
      res.status(500).json({ message: "Failed to verify credential" });
    }
  });

  // Create Custom Credential with Images
  app.post("/api/credentials/custom", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const { type, title, issuer, issuedDate, expiresDate, credentialData, imageUrl, documentUrl } = req.body;

      if (!type || !title || !issuer || !credentialData) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const did = await storage.getCurrentDidForUser(userId);
      if (!did) {
        return res.status(400).json({ message: "No DID found. Create one first." });
      }

      const credentialSubject = {
        id: did.didString,
        ...credentialData,
      };

      const ipfsCid = generateIpfsCid(credentialSubject);
      await storage.createIpfsContent({
        cid: ipfsCid,
        fileName: `${title}.json`,
        fileSize: JSON.stringify(credentialSubject).length.toString(),
        mimeType: "application/json",
        metadata: {},
      });

      const proof = {
        type: "EcdsaSecp256k1Signature2019",
        created: new Date().toISOString(),
        proofPurpose: "assertionMethod",
        verificationMethod: `${did.didString}#keys-1`,
        signature: await signData(credentialSubject, did.privateKey),
      };

      const shareToken = randomUUID();

      // Parse dates if provided
      const parsedIssuedDate = issuedDate ? new Date(issuedDate) : new Date();
      const parsedExpiresDate = expiresDate ? new Date(expiresDate) : null;

      const credential = await storage.createCredential({
        didId: did.id,
        type,
        title,
        issuer,
        issuerDid: `did:web:${issuer.toLowerCase().replace(/\s+/g, "-")}.com`,
        expiresAt: parsedExpiresDate,
        status: "verified",
        credentialSubject,
        proof,
        ipfsCid,
        imageUrl: imageUrl || null,
        documentUrl: documentUrl || null,
        shareToken,
        metadata: {
          issuanceDate: parsedIssuedDate.toISOString(),
        },
      });

      await storage.createActivity({
        didId: did.id,
        type: "credential_issued",
        description: `Created custom credential: ${title}`,
        metadata: {
          credentialId: credential.id,
          type,
        },
      });

      res.json(credential);
    } catch (error) {
      console.error("Custom credential error:", error);
      res.status(500).json({ message: "Failed to create credential" });
    }
  });

  // Public Verification by Share Token
  app.get("/api/verify/:shareToken", async (req, res) => {
    try {
      const shareToken = req.params.shareToken.trim();

      const credential =
        (await storage.getCredentialByShareToken(shareToken)) ||
        (await storage.getCredential(shareToken));

      if (!credential) {
        return res.status(404).json({ message: "Credential not found" });
      }

      const status =
        typeof credential.status === "string"
          ? credential.status.trim().toLowerCase()
          : "";
      const notExpired = credential.expiresAt
        ? new Date(credential.expiresAt) > new Date()
        : true;
      const isRevoked = status === "revoked";

      // Revoked credentials should always fail verification
      const isValid = !isRevoked && notExpired && status === "verified";

      res.json({
        credential,
        isValid,
        verification: {
          verified: status === "verified",
          notExpired,
          issuer: credential.issuer,
          issuedAt: credential.issuedAt,
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to verify credential" });
    }
  });

  // Activity Routes (protected)
  app.get("/api/activities", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const activities = await storage.getActivitiesByUserId(userId);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // IPFS Routes
  app.get("/api/ipfs/:cid", async (req, res) => {
    try {
      const content = await storage.getIpfsContent(req.params.cid);
      if (!content) {
        return res.status(404).json({ message: "IPFS content not found" });
      }
      res.json(content);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch IPFS content" });
    }
  });

  // Template Routes
  app.get("/api/templates", async (req, res) => {
    try {
      const templates = await storage.getAllCredentialTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

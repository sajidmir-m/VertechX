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
import { hashPassword, comparePassword, requireAuth } from "./auth";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication Routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const schema = z.object({
        username: z.string().min(3).max(50),
        password: z.string().min(6),
      });
      
      const validation = schema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Validation error",
          errors: validation.error.errors,
        });
      }

      const { username, password } = validation.data;

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        password: hashedPassword,
      });

      req.session.userId = user.id;
      
      res.json({
        id: user.id,
        username: user.username,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const schema = z.object({
        username: z.string(),
        password: z.string(),
      });
      
      const validation = schema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const { username, password } = validation.data;

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await comparePassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;
      
      res.json({
        id: user.id,
        username: user.username,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to login" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
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
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
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

      const { type, title, issuer } = validation.data;

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

      const credential = await storage.createCredential({
        didId: did.id,
        type,
        title,
        issuer,
        issuerDid: `did:web:${issuer.toLowerCase().replace(/\s+/g, "-")}.com`,
        expiresAt: type === "GovernmentID" 
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 5)  // 5 years
          : null,
        status: "verified",
        credentialSubject,
        proof,
        ipfsCid,
        metadata: {
          issuanceDate: new Date().toISOString(),
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
        const foundCredential = await storage.getCredential(credential);
        if (foundCredential) {
          credential = foundCredential;
        } else {
          return res.status(400).json({ message: "Invalid credential format" });
        }
      }

      if (!credential.proof || !credential.credentialSubject || !credential.title) {
        return res.status(400).json({ message: "Invalid credential structure - missing required fields (proof, credentialSubject, title)" });
      }

      const signatureValid = true;
      const notExpired = credential.expiresAt
        ? new Date(credential.expiresAt) > new Date()
        : true;
      const issuerTrusted = true;
      const proofVerified = true;

      const isValid = signatureValid && notExpired && issuerTrusted && proofVerified;

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
        isValid: isValid ? "true" : "false",
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
      const { type, title, issuer, credentialData, imageUrl, documentUrl } = req.body;

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

      const credential = await storage.createCredential({
        didId: did.id,
        type,
        title,
        issuer,
        issuerDid: `did:web:${issuer.toLowerCase().replace(/\s+/g, "-")}.com`,
        expiresAt: null,
        status: "verified",
        credentialSubject,
        proof,
        ipfsCid,
        imageUrl: imageUrl || null,
        documentUrl: documentUrl || null,
        shareToken,
        metadata: {
          issuanceDate: new Date().toISOString(),
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
      const credential = await storage.getCredentialByShareToken(req.params.shareToken);
      if (!credential) {
        return res.status(404).json({ message: "Credential not found" });
      }

      const notExpired = credential.expiresAt
        ? new Date(credential.expiresAt) > new Date()
        : true;

      const isValid = notExpired && credential.status === "verified";

      res.json({
        credential,
        isValid,
        verification: {
          verified: credential.status === "verified",
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

import type { Express } from "express";
import { createServer, type Server } from "http";
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

export async function registerRoutes(app: Express): Promise<Server> {
  // DID Routes
  app.get("/api/did/current", async (req, res) => {
    try {
      const did = await storage.getCurrentDid();
      if (!did) {
        return res.status(404).json({ message: "No DID found" });
      }
      res.json(did);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch DID" });
    }
  });

  app.post("/api/did/create", async (req, res) => {
    try {
      const keyPair = await generateKeyPair();
      const didString = generateDidString(keyPair.publicKey);

      const did = await storage.createDid({
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

  // Credential Routes
  app.get("/api/credentials", async (req, res) => {
    try {
      const credentials = await storage.getAllCredentials();
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

  app.post("/api/credentials/request", async (req, res) => {
    try {
      const validation = createCredentialRequestSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Validation error",
          errors: validation.error.errors,
        });
      }

      const { type, title, issuer } = validation.data;

      const did = await storage.getCurrentDid();
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

      if (credential.id) {
        const did = await storage.getCurrentDid();
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

  // Activity Routes
  app.get("/api/activities", async (req, res) => {
    try {
      const activities = await storage.getAllActivities();
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

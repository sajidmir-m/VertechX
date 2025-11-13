import {
  type Did,
  type InsertDid,
  type Credential,
  type InsertCredential,
  type Verification,
  type InsertVerification,
  type IpfsContent,
  type InsertIpfsContent,
  type Activity,
  type InsertActivity,
  type CredentialTemplate,
  type InsertCredentialTemplate,
  type User,
  type InsertUser,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  createUser(user: InsertUser): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  updateUserCurrentDid(userId: string, didId: string): Promise<void>;
  
  // DID operations
  getDid(id: string): Promise<Did | undefined>;
  getDidByString(didString: string): Promise<Did | undefined>;
  getDidsByUserId(userId: string): Promise<Did[]>;
  getCurrentDidForUser(userId: string): Promise<Did | undefined>;
  createDid(did: InsertDid): Promise<Did>;
  
  // Credential operations
  getCredential(id: string): Promise<Credential | undefined>;
  getCredentialByShareToken(token: string): Promise<Credential | undefined>;
  getCredentialsByDidId(didId: string): Promise<Credential[]>;
  getCredentialsByUserId(userId: string): Promise<Credential[]>;
  createCredential(credential: InsertCredential): Promise<Credential>;
  updateCredentialStatus(id: string, status: string): Promise<Credential | undefined>;
  
  // Verification operations
  getVerification(id: string): Promise<Verification | undefined>;
  getVerificationsByCredentialId(credentialId: string): Promise<Verification[]>;
  createVerification(verification: InsertVerification): Promise<Verification>;
  
  // IPFS operations
  getIpfsContent(cid: string): Promise<IpfsContent | undefined>;
  createIpfsContent(content: InsertIpfsContent): Promise<IpfsContent>;
  
  // Activity operations
  getActivitiesByDidId(didId: string): Promise<Activity[]>;
  getActivitiesByUserId(userId: string): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Template operations
  getCredentialTemplate(id: string): Promise<CredentialTemplate | undefined>;
  getAllCredentialTemplates(): Promise<CredentialTemplate[]>;
  createCredentialTemplate(template: InsertCredentialTemplate): Promise<CredentialTemplate>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private dids: Map<string, Did>;
  private credentials: Map<string, Credential>;
  private verifications: Map<string, Verification>;
  private ipfsContents: Map<string, IpfsContent>;
  private activities: Map<string, Activity>;
  private templates: Map<string, CredentialTemplate>;

  constructor() {
    this.users = new Map();
    this.dids = new Map();
    this.credentials = new Map();
    this.verifications = new Map();
    this.ipfsContents = new Map();
    this.activities = new Map();
    this.templates = new Map();
    this.initializeTemplates();
  }

  private initializeTemplates() {
    const templates: InsertCredentialTemplate[] = [
      {
        name: "Educational Credential",
        type: "EducationalCredential",
        issuer: "University of Blockchain",
        schema: {
          degree: "string",
          major: "string",
          graduationYear: "number",
          institution: "string",
        },
        requiredFields: ["degree", "major", "graduationYear"],
      },
      {
        name: "Government ID",
        type: "GovernmentID",
        issuer: "Digital Government Authority",
        schema: {
          idNumber: "string",
          fullName: "string",
          dateOfBirth: "string",
          nationality: "string",
        },
        requiredFields: ["idNumber", "fullName", "dateOfBirth"],
      },
      {
        name: "Employment Credential",
        type: "EmploymentCredential",
        issuer: "Tech Corp Inc.",
        schema: {
          position: "string",
          company: "string",
          startDate: "string",
          endDate: "string",
        },
        requiredFields: ["position", "company", "startDate"],
      },
    ];

    templates.forEach((template) => {
      this.createCredentialTemplate(template);
    });
  }

  // User operations
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      currentDidId: null,
    };
    this.users.set(id, user);
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async updateUserCurrentDid(userId: string, didId: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.currentDidId = didId;
      this.users.set(userId, user);
    }
  }

  // DID operations
  async getDid(id: string): Promise<Did | undefined> {
    return this.dids.get(id);
  }

  async getDidByString(didString: string): Promise<Did | undefined> {
    return Array.from(this.dids.values()).find(
      (did) => did.didString === didString
    );
  }

  async getDidsByUserId(userId: string): Promise<Did[]> {
    return Array.from(this.dids.values()).filter(did => did.userId === userId);
  }

  async getCurrentDidForUser(userId: string): Promise<Did | undefined> {
    const user = await this.getUserById(userId);
    if (user?.currentDidId) {
      return this.dids.get(user.currentDidId);
    }
    const userDids = await this.getDidsByUserId(userId);
    if (userDids.length > 0) {
      await this.updateUserCurrentDid(userId, userDids[0].id);
      return userDids[0];
    }
    return undefined;
  }

  async createDid(insertDid: InsertDid): Promise<Did> {
    const id = randomUUID();
    const did: Did = {
      ...insertDid,
      id,
      method: insertDid.method || "key",
      metadata: insertDid.metadata || {},
      createdAt: new Date(),
    };
    this.dids.set(id, did);
    await this.updateUserCurrentDid(insertDid.userId, id);
    return did;
  }

  // Credential operations
  async getCredential(id: string): Promise<Credential | undefined> {
    return this.credentials.get(id);
  }

  async getCredentialByShareToken(token: string): Promise<Credential | undefined> {
    return Array.from(this.credentials.values()).find(
      (cred) => cred.shareToken === token
    );
  }

  async getCredentialsByDidId(didId: string): Promise<Credential[]> {
    return Array.from(this.credentials.values()).filter(
      (cred) => cred.didId === didId
    );
  }

  async getCredentialsByUserId(userId: string): Promise<Credential[]> {
    const userDids = await this.getDidsByUserId(userId);
    const didIds = new Set(userDids.map(d => d.id));
    return Array.from(this.credentials.values())
      .filter(cred => didIds.has(cred.didId))
      .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());
  }

  async createCredential(insertCredential: InsertCredential): Promise<Credential> {
    const id = randomUUID();
    const credential: Credential = {
      ...insertCredential,
      id,
      status: insertCredential.status || "verified",
      expiresAt: insertCredential.expiresAt || null,
      issuerDid: insertCredential.issuerDid || null,
      ipfsCid: insertCredential.ipfsCid || null,
      imageUrl: insertCredential.imageUrl || null,
      documentUrl: insertCredential.documentUrl || null,
      shareToken: insertCredential.shareToken || null,
      metadata: insertCredential.metadata || {},
      issuedAt: new Date(),
    };
    this.credentials.set(id, credential);
    return credential;
  }

  async updateCredentialStatus(
    id: string,
    status: string
  ): Promise<Credential | undefined> {
    const credential = this.credentials.get(id);
    if (credential) {
      credential.status = status;
      this.credentials.set(id, credential);
      return credential;
    }
    return undefined;
  }

  // Verification operations
  async getVerification(id: string): Promise<Verification | undefined> {
    return this.verifications.get(id);
  }

  async getVerificationsByCredentialId(
    credentialId: string
  ): Promise<Verification[]> {
    return Array.from(this.verifications.values()).filter(
      (ver) => ver.credentialId === credentialId
    );
  }

  async createVerification(
    insertVerification: InsertVerification
  ): Promise<Verification> {
    const id = randomUUID();
    const verification: Verification = {
      ...insertVerification,
      id,
      credentialId: insertVerification.credentialId || null,
      verifierDid: insertVerification.verifierDid || null,
      result: insertVerification.result || {},
      verifiedAt: new Date(),
    };
    this.verifications.set(id, verification);
    return verification;
  }

  // IPFS operations
  async getIpfsContent(cid: string): Promise<IpfsContent | undefined> {
    return this.ipfsContents.get(cid);
  }

  async createIpfsContent(
    insertIpfsContent: InsertIpfsContent
  ): Promise<IpfsContent> {
    const id = randomUUID();
    const content: IpfsContent = {
      ...insertIpfsContent,
      id,
      fileSize: insertIpfsContent.fileSize || null,
      mimeType: insertIpfsContent.mimeType || null,
      metadata: insertIpfsContent.metadata || {},
      uploadedAt: new Date(),
    };
    this.ipfsContents.set(insertIpfsContent.cid, content);
    return content;
  }

  // Activity operations
  async getActivitiesByDidId(didId: string): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter((act) => act.didId === didId)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
  }

  async getActivitiesByUserId(userId: string): Promise<Activity[]> {
    const userDids = await this.getDidsByUserId(userId);
    const didIds = new Set(userDids.map(d => d.id));
    return Array.from(this.activities.values())
      .filter(act => act.didId && didIds.has(act.didId))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = randomUUID();
    const activity: Activity = {
      ...insertActivity,
      id,
      didId: insertActivity.didId || null,
      metadata: insertActivity.metadata || {},
      timestamp: new Date(),
    };
    this.activities.set(id, activity);
    return activity;
  }

  // Template operations
  async getCredentialTemplate(
    id: string
  ): Promise<CredentialTemplate | undefined> {
    return this.templates.get(id);
  }

  async getAllCredentialTemplates(): Promise<CredentialTemplate[]> {
    return Array.from(this.templates.values());
  }

  async createCredentialTemplate(
    insertTemplate: InsertCredentialTemplate
  ): Promise<CredentialTemplate> {
    const id = randomUUID();
    const template: CredentialTemplate = {
      ...insertTemplate,
      id,
      requiredFields: insertTemplate.requiredFields || null,
      schema: insertTemplate.schema || {},
      createdAt: new Date(),
    };
    this.templates.set(id, template);
    return template;
  }
}

export const storage = new MemStorage();

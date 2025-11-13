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
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // DID operations
  getDid(id: string): Promise<Did | undefined>;
  getDidByString(didString: string): Promise<Did | undefined>;
  getCurrentDid(): Promise<Did | undefined>;
  setCurrentDid(id: string): Promise<void>;
  createDid(did: InsertDid): Promise<Did>;
  
  // Credential operations
  getCredential(id: string): Promise<Credential | undefined>;
  getCredentialsByDidId(didId: string): Promise<Credential[]>;
  getAllCredentials(): Promise<Credential[]>;
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
  getAllActivities(): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Template operations
  getCredentialTemplate(id: string): Promise<CredentialTemplate | undefined>;
  getAllCredentialTemplates(): Promise<CredentialTemplate[]>;
  createCredentialTemplate(template: InsertCredentialTemplate): Promise<CredentialTemplate>;
}

export class MemStorage implements IStorage {
  private dids: Map<string, Did>;
  private credentials: Map<string, Credential>;
  private verifications: Map<string, Verification>;
  private ipfsContents: Map<string, IpfsContent>;
  private activities: Map<string, Activity>;
  private templates: Map<string, CredentialTemplate>;
  private currentDidId: string | null;

  constructor() {
    this.dids = new Map();
    this.credentials = new Map();
    this.verifications = new Map();
    this.ipfsContents = new Map();
    this.activities = new Map();
    this.templates = new Map();
    this.currentDidId = null;
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

  // DID operations
  async getDid(id: string): Promise<Did | undefined> {
    return this.dids.get(id);
  }

  async getDidByString(didString: string): Promise<Did | undefined> {
    return Array.from(this.dids.values()).find(
      (did) => did.didString === didString
    );
  }

  async getCurrentDid(): Promise<Did | undefined> {
    if (this.currentDidId) {
      return this.dids.get(this.currentDidId);
    }
    const dids = Array.from(this.dids.values());
    if (dids.length > 0) {
      this.currentDidId = dids[0].id;
      return dids[0];
    }
    return undefined;
  }

  async setCurrentDid(id: string): Promise<void> {
    const did = this.dids.get(id);
    if (did) {
      this.currentDidId = id;
    }
  }

  async createDid(insertDid: InsertDid): Promise<Did> {
    const id = randomUUID();
    const did: Did = {
      ...insertDid,
      id,
      createdAt: new Date(),
    };
    this.dids.set(id, did);
    if (!this.currentDidId) {
      this.currentDidId = id;
    }
    return did;
  }

  // Credential operations
  async getCredential(id: string): Promise<Credential | undefined> {
    return this.credentials.get(id);
  }

  async getCredentialsByDidId(didId: string): Promise<Credential[]> {
    return Array.from(this.credentials.values()).filter(
      (cred) => cred.didId === didId
    );
  }

  async getAllCredentials(): Promise<Credential[]> {
    return Array.from(this.credentials.values()).sort(
      (a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime()
    );
  }

  async createCredential(insertCredential: InsertCredential): Promise<Credential> {
    const id = randomUUID();
    const credential: Credential = {
      ...insertCredential,
      id,
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

  async getAllActivities(): Promise<Activity[]> {
    return Array.from(this.activities.values()).sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = randomUUID();
    const activity: Activity = {
      ...insertActivity,
      id,
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
      createdAt: new Date(),
    };
    this.templates.set(id, template);
    return template;
  }
}

export const storage = new MemStorage();

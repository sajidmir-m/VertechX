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
  type Organization,
  type InsertOrganization,
  dids,
  users,
  credentials,
  verifications,
  ipfsContent,
  activities,
  credentialTemplates,
  organizations,
} from "@shared/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { db } from "./db";

export interface IStorage {
  // User operations
  createUser(user: InsertUser): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  getUserBySupabaseId(supabaseUserId: string): Promise<User | undefined>;
  updateUserAuthInfo(
    userId: string,
    data: Partial<Pick<User, "email" | "supabaseUserId">>
  ): Promise<User | undefined>;
  updateUserCurrentDid(userId: string, didId: string): Promise<void>;
  deleteUser(userId: string): Promise<void>;
  
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
  
  // Organization operations
  createOrganization(org: InsertOrganization): Promise<Organization>;
  getOrganizationByEmail(email: string): Promise<Organization | undefined>;
  getOrganizationById(id: string): Promise<Organization | undefined>;
  getOrganizationBySupabaseId(supabaseUserId: string): Promise<Organization | undefined>;
  updateOrganizationAuthInfo(
    orgId: string,
    data: Partial<Pick<Organization, "email" | "supabaseUserId">>
  ): Promise<Organization | undefined>;
  getAllOrganizations(): Promise<Organization[]>;
}

export class DbStorage implements IStorage {
  private templatesInitialized = false;

  constructor() {}

  private async ensureTemplatesInitialized() {
    if (this.templatesInitialized) return;
    
    try {
      const existingTemplates = await db.select().from(credentialTemplates);
      if (existingTemplates.length === 0) {
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

        for (const template of templates) {
          await db.insert(credentialTemplates).values(template);
        }
      }
      this.templatesInitialized = true;
    } catch (error) {
      console.error("Failed to initialize templates:", error);
    }
  }

  // User operations
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserBySupabaseId(supabaseUserId: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.supabaseUserId, supabaseUserId));
    return user;
  }

  async updateUserAuthInfo(
    userId: string,
    data: Partial<Pick<User, "email" | "supabaseUserId">>
  ): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, userId)).returning();
    return user;
  }

  async updateUserCurrentDid(userId: string, didId: string): Promise<void> {
    await db.update(users).set({ currentDidId: didId }).where(eq(users.id, userId));
  }

  async deleteUser(userId: string): Promise<void> {
    // Get user's DIDs
    const userDids = await this.getDidsByUserId(userId);
    const didIds = userDids.map(d => d.id);
    
    // Delete related data (cascading deletes should handle most, but being explicit)
    if (didIds.length > 0) {
      // Delete verifications for user's credentials
      const userCredentials = await this.getCredentialsByUserId(userId);
      const credentialIds = userCredentials.map(c => c.id);
      if (credentialIds.length > 0) {
        await db.delete(verifications).where(inArray(verifications.credentialId, credentialIds));
      }
      
      // Delete credentials
      await db.delete(credentials).where(inArray(credentials.didId, didIds));
      
      // Delete activities
      await db.delete(activities).where(inArray(activities.didId, didIds));
      
      // Delete DIDs
      await db.delete(dids).where(inArray(dids.id, didIds));
    }
    
    // Delete user
    await db.delete(users).where(eq(users.id, userId));
  }

  // DID operations
  async getDid(id: string): Promise<Did | undefined> {
    const [did] = await db.select().from(dids).where(eq(dids.id, id));
    return did;
  }

  async getDidByString(didString: string): Promise<Did | undefined> {
    const [did] = await db.select().from(dids).where(eq(dids.didString, didString));
    return did;
  }

  async getDidsByUserId(userId: string): Promise<Did[]> {
    return await db.select().from(dids).where(eq(dids.userId, userId));
  }

  async getCurrentDidForUser(userId: string): Promise<Did | undefined> {
    const user = await this.getUserById(userId);
    if (user?.currentDidId) {
      return await this.getDid(user.currentDidId);
    }
    const userDids = await this.getDidsByUserId(userId);
    if (userDids.length > 0) {
      await this.updateUserCurrentDid(userId, userDids[0].id);
      return userDids[0];
    }
    return undefined;
  }

  async createDid(insertDid: InsertDid): Promise<Did> {
    const [did] = await db.insert(dids).values(insertDid).returning();
    await this.updateUserCurrentDid(insertDid.userId, did.id);
    return did;
  }

  // Credential operations
  async getCredential(id: string): Promise<Credential | undefined> {
    const [credential] = await db.select().from(credentials).where(eq(credentials.id, id));
    return credential;
  }

  async getCredentialByShareToken(token: string): Promise<Credential | undefined> {
    const [credential] = await db.select().from(credentials).where(eq(credentials.shareToken, token));
    return credential;
  }

  async getCredentialsByDidId(didId: string): Promise<Credential[]> {
    return await db
      .select()
      .from(credentials)
      .where(eq(credentials.didId, didId))
      .orderBy(desc(credentials.issuedAt));
  }

  async getCredentialsByUserId(userId: string): Promise<Credential[]> {
    const userDids = await this.getDidsByUserId(userId);
    if (userDids.length === 0) return [];
    
    const didIds = userDids.map(d => d.id);
    return await db
      .select()
      .from(credentials)
      .where(inArray(credentials.didId, didIds))
      .orderBy(desc(credentials.issuedAt));
  }

  async createCredential(insertCredential: InsertCredential): Promise<Credential> {
    const [credential] = await db.insert(credentials).values(insertCredential).returning();
    return credential;
  }

  async updateCredentialStatus(id: string, status: string): Promise<Credential | undefined> {
    const [credential] = await db
      .update(credentials)
      .set({ status })
      .where(eq(credentials.id, id))
      .returning();
    return credential;
  }

  // Verification operations
  async getVerification(id: string): Promise<Verification | undefined> {
    const [verification] = await db.select().from(verifications).where(eq(verifications.id, id));
    return verification;
  }

  async getVerificationsByCredentialId(credentialId: string): Promise<Verification[]> {
    return await db
      .select()
      .from(verifications)
      .where(eq(verifications.credentialId, credentialId));
  }

  async createVerification(insertVerification: InsertVerification): Promise<Verification> {
    const [verification] = await db.insert(verifications).values(insertVerification).returning();
    return verification;
  }

  // IPFS operations
  async getIpfsContent(cid: string): Promise<IpfsContent | undefined> {
    const [content] = await db.select().from(ipfsContent).where(eq(ipfsContent.cid, cid));
    return content;
  }

  async createIpfsContent(insertIpfsContent: InsertIpfsContent): Promise<IpfsContent> {
    const [content] = await db.insert(ipfsContent).values(insertIpfsContent).returning();
    return content;
  }

  // Activity operations
  async getActivitiesByDidId(didId: string): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(eq(activities.didId, didId))
      .orderBy(desc(activities.timestamp));
  }

  async getActivitiesByUserId(userId: string): Promise<Activity[]> {
    const userDids = await this.getDidsByUserId(userId);
    if (userDids.length === 0) return [];
    
    const didIds = userDids.map(d => d.id);
    return await db
      .select()
      .from(activities)
      .where(inArray(activities.didId, didIds))
      .orderBy(desc(activities.timestamp));
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const [activity] = await db.insert(activities).values(insertActivity).returning();
    return activity;
  }

  // Template operations
  async getCredentialTemplate(id: string): Promise<CredentialTemplate | undefined> {
    const [template] = await db.select().from(credentialTemplates).where(eq(credentialTemplates.id, id));
    return template;
  }

  async getAllCredentialTemplates(): Promise<CredentialTemplate[]> {
    await this.ensureTemplatesInitialized();
    return await db.select().from(credentialTemplates);
  }

  async createCredentialTemplate(insertTemplate: InsertCredentialTemplate): Promise<CredentialTemplate> {
    const [template] = await db.insert(credentialTemplates).values(insertTemplate).returning();
    return template;
  }

  // Organization operations
  async createOrganization(insertOrg: InsertOrganization): Promise<Organization> {
    const [org] = await db.insert(organizations).values(insertOrg).returning();
    return org;
  }

  async getOrganizationByEmail(email: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.email, email));
    return org;
  }

  async getOrganizationById(id: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    return org;
  }

  async getOrganizationBySupabaseId(supabaseUserId: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.supabaseUserId, supabaseUserId));
    return org;
  }

  async updateOrganizationAuthInfo(
    orgId: string,
    data: Partial<Pick<Organization, "email" | "supabaseUserId">>
  ): Promise<Organization | undefined> {
    const [updated] = await db
      .update(organizations)
      .set(data)
      .where(eq(organizations.id, orgId))
      .returning();
    return updated;
  }

  async getAllOrganizations(): Promise<Organization[]> {
    return await db.select().from(organizations).orderBy(desc(organizations.createdAt));
  }
}

export const storage = new DbStorage();

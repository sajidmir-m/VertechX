import { randomBytes, createHash } from "crypto";
import { webcrypto } from "crypto";

const { subtle } = webcrypto;

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export async function generateKeyPair(): Promise<KeyPair> {
  const keyPair = await subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    true,
    ["sign", "verify"]
  );

  const publicKeyJwk = await subtle.exportKey("jwk", keyPair.publicKey);
  const privateKeyJwk = await subtle.exportKey("jwk", keyPair.privateKey);

  return {
    publicKey: JSON.stringify(publicKeyJwk),
    privateKey: JSON.stringify(privateKeyJwk),
  };
}

export function generateDidString(publicKey: string): string {
  const hash = createHash("sha256")
    .update(publicKey)
    .digest("hex")
    .substring(0, 32);
  return `did:key:z${hash}`;
}

export async function signData(data: any, privateKeyJwk: string): Promise<string> {
  const privateKey = await subtle.importKey(
    "jwk",
    JSON.parse(privateKeyJwk),
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    false,
    ["sign"]
  );

  const dataString = JSON.stringify(data);
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(dataString);

  const signature = await subtle.sign(
    {
      name: "ECDSA",
      hash: { name: "SHA-256" },
    },
    privateKey,
    dataBuffer
  );

  return Buffer.from(signature).toString("hex");
}

export async function verifySignature(
  data: any,
  signature: string,
  publicKeyJwk: string
): Promise<boolean> {
  try {
    const publicKey = await subtle.importKey(
      "jwk",
      JSON.parse(publicKeyJwk),
      {
        name: "ECDSA",
        namedCurve: "P-256",
      },
      false,
      ["verify"]
    );

    const dataString = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(dataString);
    const signatureBuffer = Buffer.from(signature, "hex");

    return await subtle.verify(
      {
        name: "ECDSA",
        hash: { name: "SHA-256" },
      },
      publicKey,
      signatureBuffer,
      dataBuffer
    );
  } catch (error) {
    return false;
  }
}

export function generateIpfsCid(data: any): string {
  const hash = createHash("sha256")
    .update(JSON.stringify(data))
    .digest("hex");
  return `Qm${hash.substring(0, 44)}`;
}

export function generateZeroKnowledgeProof(
  credentialData: any,
  selectedFields: string[]
): string {
  const proof = {
    type: "ZeroKnowledgeProof",
    proofPurpose: "authentication",
    created: new Date().toISOString(),
    verificationMethod: "did:example:123#keys-1",
    challenge: randomBytes(32).toString("hex"),
    disclosedFields: selectedFields,
    proofValue: createHash("sha256")
      .update(JSON.stringify({ credentialData, selectedFields }))
      .digest("hex"),
  };

  return JSON.stringify(proof, null, 2);
}

export function hashData(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}

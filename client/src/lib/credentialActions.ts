import jsPDF from "jspdf";
import type { Credential } from "@shared/schema";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "credential";
}

export function downloadCredentialAsPdf(credential: Credential) {
  const doc = new jsPDF();
  const marginLeft = 14;
  let cursorY = 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(credential.title || "Credential", marginLeft, cursorY);

  cursorY += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  const lines = [
    `Type: ${credential.type}`,
    `Issuer: ${credential.issuer}`,
    `Issued: ${credential.issuedAt ? new Date(credential.issuedAt).toLocaleString() : "N/A"}`,
    `Status: ${credential.status}`,
  ];

  if (credential.expiresAt) {
    lines.push(`Expires: ${new Date(credential.expiresAt).toLocaleString()}`);
  }

  if (credential.shareToken) {
    lines.push(`Share Token: ${credential.shareToken}`);
  }

  lines.forEach((line) => {
    doc.text(line, marginLeft, cursorY);
    cursorY += 7;
  });

  cursorY += 5;
  doc.setFont("helvetica", "bold");
  doc.text("Credential Subject", marginLeft, cursorY);

  cursorY += 8;
  doc.setFont("helvetica", "normal");
  const subjectContent = JSON.stringify(credential.credentialSubject, null, 2);
  const subjectLines = doc.splitTextToSize(subjectContent, 180);
  doc.text(subjectLines, marginLeft, cursorY);

  cursorY += subjectLines.length * 6 + 6;
  doc.setFont("helvetica", "bold");
  doc.text("Proof", marginLeft, cursorY);

  cursorY += 8;
  doc.setFont("helvetica", "normal");
  const proofContent = JSON.stringify(credential.proof, null, 2);
  const proofLines = doc.splitTextToSize(proofContent, 180);
  doc.text(proofLines, marginLeft, cursorY);

  const fileName = `${slugify(credential.title || credential.id)}.pdf`;
  doc.save(fileName);
}

export function getCredentialShareUrl(credential: Credential): string | null {
  if (!credential.shareToken) {
    return null;
  }
  return `${window.location.origin}/verify/${credential.shareToken}`;
}

export async function shareCredentialLink(credential: Credential): Promise<{
  url: string;
  method: "web-share" | "clipboard";
}> {
  const url = getCredentialShareUrl(credential);

  if (!url) {
    throw new Error("This credential doesn't have a share link yet. Request or recreate it first.");
  }

  if (navigator.share) {
    await navigator.share({
      title: credential.title,
      text: "Verify this credential using the secure viewer.",
      url,
    });
    return { url, method: "web-share" };
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url);
    return { url, method: "clipboard" };
  }

  const textarea = document.createElement("textarea");
  textarea.value = url;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
  return { url, method: "clipboard" };
}


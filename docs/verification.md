# Verification & Credential Lifecycle

This project now relies on Supabase for account management and PostgreSQL storage, while the credential lifecycle remains anchored in the DID/VC design outlined in the project brief. This document captures the end-to-end flow so it is easy to maintain, demo, or extend.

## 1. Authentication (Supabase-backed)

1. **Sign-up**  
   - `/api/auth/register` validates `username`, `email`, and password.
   - It provisions a Supabase Auth user via the Admin API (service role key).
   - A local record is created in the `users` table with the Supabase UID, hashed password, and metadata.
   - The Express session stores the internal user ID for subsequent API access.

2. **Sign-in**  
   - `/api/auth/login` delegates password validation to Supabase (`auth.signInWithPassword`).
   - On success, we reconcile the Supabase UID with the local user record and refresh the Express session.

3. **Session introspection**  
   - `/api/auth/me` reads the session, fetches the user profile (username + email), and drives UI state via `useAuth`.

## 2. Credential Issuance

1. **Request**  
   - Authenticated users call `/api/credentials/request` or `/api/credentials/custom`.
   - The API checks that the user has an active DID (creates one if needed).
   - It synthesises credential subject data, generates an IPFS CID placeholder, and signs the payload with the DID keypair.

2. **Storage**  
   - Credentials, activities, proofs, and IPFS metadata are persisted through Drizzle ORM into Supabase Postgres.
   - Every credential now receives a UUID `shareToken` so it can be referenced publicly.

3. **Activity log**  
   - Each issuance, verification, or disclosure writes an `activities` record for the DID timeline feed.

## 3. Viewing & Managing Credentials

1. **Dashboard cards**  
   - `CredentialCard` summarises status, issuer, issuance date, and offers quick actions:
     - `View` opens `CredentialDetailModal`.
     - `Share` generates/copies a public verification link using the `shareToken`.
     - `Selective Disclosure` opens the ZKP dialog to choose which fields to expose.
     - `Download` generates a signed PDF snapshot of the credential via jsPDF.

2. **Detail modal**  
   - Offers a structured view of all credential subject fields, raw JSON, proof material, linked assets, and the share link.
   - Download and share actions mirror the card controls and surface user feedback via toasts.

## 4. Sharing & Public Verification

1. **Share link**  
   - Every credential exposes a URL of the form `/verify/:shareToken`.
   - The frontend public route (`PublicCredential`) fetches `/api/verify/:shareToken` and renders a read-only view with verification results, subject data, and PDF/share actions.

2. **Selective disclosure**  
   - Holders can generate a zero-knowledge proof subset via `/api/credentials/selective-disclosure`.
   - The dialog guides field selection, copies the proof payload, and logs the activity.

## 5. Automated Verification (`/api/verify`)

1. **Input normalisation**  
   - Accepts a share token, credential ID, or raw JSON.
   - Resolves to a stored credential when possible.

2. **Validation pipeline**  
   - `signatureValid`: cryptographic signature (mocked true in the demo, but code structured for real checks).
   - `notExpired`: compares `expiresAt` with the current time.
   - `issuerTrusted`: placeholder for registry / trust framework validation.
   - `proofVerified`: placeholder for ZKP verification logic.

3. **Result persistence**  
   - Writes a `verifications` record including detailed checks.
   - If the holder is signed in, emits an activity entry describing the verification outcome.

4. **Response payload**  
   - Returns `isValid`, original credential snapshot, and the boolean breakdown used to drive UI badges.

## 6. PDFs & Evidence Portability

1. **jsPDF integration**  
   - Both the dashboard modal and the public viewer invoke `downloadCredentialAsPdf` to generate a portable PDF containing:
     - Header metadata (issuer, status, timestamps).
     - Credential subject fields.
     - Proof JSON for auditability.

2. **Usage**  
   - Ideal for offline review or attaching to submissions where a verifiable paper trail is required.

## 7. Operational Checklist

1. Ensure the following environment variables are defined:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_ANON_KEY` (optional but recommended)
   - `DATABASE_URL` (Supabase Postgres connection string)
   - `SESSION_SECRET`

2. After pulling the latest code, run:
   ```bash
   npm install
   npm run db:push  # applies migrations, including Supabase auth columns
   npm run dev
   ```

3. Seed or request a credential, then:
   - Click `View` → confirm custom data renders.
   - Click `Download` → PDF downloads.
   - Click `Share` → receive web share or clipboard toast.
   - Browse to the copied `/verify/:token` link in an incognito window to see the public verifier.

The combination of Supabase-backed auth, structured credential visualisation, and portable verification flows brings the project in line with the original “Decentralized Digital Identity & Credential Vault” vision.


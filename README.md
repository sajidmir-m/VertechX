# 🔐 Decentralized Digital Identity & Credential Vault

A modern, secure platform for managing decentralized digital identities (DIDs) and verifiable credentials (VCs) using blockchain technology, IPFS storage, and cryptographic proofs.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Project](#running-the-project)
- [Project Structure](#project-structure)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
- [Usage Guide](#usage-guide)
- [Admin Portal](#admin-portal)
- [Credential Management](#credential-management)
- [Verification Process](#verification-process)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

This project implements a **Decentralized Digital Identity & Credential Vault** that allows users to:

- Create and manage their Decentralized Identifiers (DIDs)
- Store and manage verifiable credentials securely
- Share credentials with selective disclosure
- Verify credentials cryptographically
- Download credentials as PDFs
- Organizations can verify user credentials through an admin portal

The system uses:
- **Supabase** for authentication
- **PostgreSQL** for data storage
- **Drizzle ORM** for database management
- **Express.js** for the backend API
- **React + TypeScript** for the frontend
- **Tailwind CSS** for styling

## ✨ Features

### User Features
- 🔑 **Decentralized Identity (DID) Management**: Create and manage your unique DID
- 📜 **Credential Vault**: Store and organize verifiable credentials
- 📝 **Custom Credentials**: Create credentials with custom data and fields
- 📄 **PDF Export**: Download credentials as PDF documents
- 🔗 **Share Links**: Generate shareable links for credential verification
- ✅ **Credential Verification**: Verify credentials using cryptographic proofs
- 🎨 **Modern UI**: Responsive design with dark mode support
- 🔒 **Secure Authentication**: Supabase-based authentication system

### Admin Features
- 🏢 **Organization Portal**: Dedicated portal for organizations
- ✅ **Credential Verification**: Verify user credentials with detailed results
- 📊 **Complete Document Details**: View all credential data, issuer info, and verification status
- 🔍 **Multiple Input Formats**: Accept share links, tokens, or raw JSON

## 🛠 Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Wouter** - Lightweight routing
- **TanStack Query** - Data fetching and state management
- **Tailwind CSS** - Styling
- **Radix UI** - Accessible component primitives
- **jsPDF** - PDF generation
- **Lucide React** - Icons

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Supabase** - Authentication
- **PostgreSQL** - Database
- **Drizzle ORM** - Database toolkit
- **bcryptjs** - Password hashing
- **express-session** - Session management

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **PostgreSQL** database (or Supabase PostgreSQL)
- **Supabase Account** (for authentication)

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd LangQuest
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables** (see [Environment Variables](#environment-variables))

4. **Set up the database** (see [Database Setup](#database-setup))

5. **Run database migrations**
   ```bash
   npm run db:push
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

## 🔐 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Session Secret (for express-session)
SESSION_SECRET=your-random-secret-key-change-in-production

# Server Port (optional, defaults to 5000)
PORT=5000

# Node Environment
NODE_ENV=development
```

### Getting Supabase Credentials

1. Go to [Supabase](https://supabase.com) and create a project
2. Navigate to **Settings** → **API**
3. Copy the following:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

### Getting Database URL

If using Supabase PostgreSQL:
1. Go to **Settings** → **Database**
2. Copy the **Connection string** (URI format)
3. Use it as `DATABASE_URL`

## 🗄 Database Setup

1. **Create a PostgreSQL database** (or use Supabase PostgreSQL)

2. **Update `DATABASE_URL`** in your `.env` file

3. **Push the schema to the database**
   ```bash
   npm run db:push
   ```

This will create all necessary tables:
- `users` - User accounts
- `organizations` - Organization/admin accounts
- `dids` - Decentralized Identifiers
- `credentials` - Verifiable Credentials
- `verifications` - Verification records

## ▶️ Running the Project

### Development Mode
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Type Checking
```bash
npm run check
```

## 📁 Project Structure

```
LangQuest/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── ui/         # UI component library
│   │   │   └── ...        # Feature components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utility functions
│   └── index.html
├── server/                 # Backend Express application
│   ├── auth.ts            # Authentication middleware
│   ├── crypto.ts          # Cryptographic functions
│   ├── db.ts              # Database connection
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Database operations
│   ├── supabase.ts        # Supabase client
│   └── validation.ts      # Request validation
├── shared/                 # Shared types and schemas
│   └── schema.ts          # Database schema
├── package.json
├── tsconfig.json
└── README.md
```

## 🔑 Authentication

### User Authentication

**Registration:**
- Navigate to `/register`
- Enter username, email, and password
- Account is created in Supabase and local database

**Login:**
- Navigate to `/login`
- Enter email and password
- Session is created and stored

**Default User Flow:**
1. Register/Login → Dashboard
2. Create DID → Wallet page
3. Request/Create Credentials → Credentials page
4. Verify Credentials → Verify page

### Admin Authentication

**Admin Login:**
- Navigate to `/admin/login`
- Use default credentials:
  - **Email**: `fahaidjaveed@gmail.com`
  - **Password**: `123456`

**Default Admin Account:**
- Automatically created on server startup
- Can be used immediately after setup
- Organization name: "Default Admin Organization"
- Role: "verifier"

**Admin Flow:**
1. Login → Admin Dashboard
2. Paste credential data (share link, token, or JSON)
3. View verification results with complete details

## 🌐 API Endpoints

### Authentication Endpoints

#### User Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

#### Admin Authentication
- `POST /api/admin/login` - Login organization
- `POST /api/admin/logout` - Logout organization
- `GET /api/admin/me` - Get current organization

### DID Endpoints
- `POST /api/did/create` - Create a new DID
- `GET /api/did/current` - Get current user's DID
- `GET /api/did/:id` - Get DID by ID

### Credential Endpoints
- `POST /api/credentials/request` - Request a credential (template-based)
- `POST /api/credentials/custom` - Create custom credential
- `GET /api/credentials` - Get all user credentials
- `GET /api/credentials/:id` - Get credential by ID
- `DELETE /api/credentials/:id` - Delete credential

### Verification Endpoints
- `POST /api/verify` - Verify credential (public)
- `GET /api/verify/:shareToken` - Verify credential via share token
- `POST /api/admin/verify` - Verify credential (admin portal)

## 📖 Usage Guide

### Creating Your Identity

1. **Register/Login** to your account
2. Go to **Wallet** page
3. Click **"Create Your DID"**
4. Your unique DID will be generated and displayed
5. You can view the QR code for sharing

### Requesting Credentials

1. Go to **Credentials** page
2. Click **"Request Credential"**
3. Choose credential type:
   - **Template-based**: Select from Educational, Government ID, or Employment
   - **Custom**: Provide your own data
4. Fill in required fields:
   - **Issuer** (required)
   - **Issued Date** (optional)
   - **Expires Date** (optional)
   - **Credential Data** (custom fields)
5. Submit to create the credential

### Creating Custom Credentials

1. In the **Request Credential** dialog, enable **"Provide custom credential data"**
2. Choose input method:
   - **Simple Form**: Add key-value pairs
   - **JSON Editor**: Paste raw JSON
3. Add issuer and dates
4. Preview your JSON
5. Submit to create

### Sharing Credentials

1. Go to **Credentials** page
2. Click on a credential card
3. Click **"Share"** button
4. Copy the share link
5. Share the link with others for verification

### Downloading Credentials as PDF

1. Open a credential
2. Click **"Download PDF"** button
3. PDF will be generated and downloaded automatically

### Verifying Credentials

**As a User:**
1. Go to **Verify** page
2. Paste one of the following:
   - Share link (e.g., `/verify/abc-123`)
   - Share token
   - Raw credential JSON
3. Click **"Verify"**
4. View verification results

**Accepted Formats:**
- Share link: `http://localhost:5000/verify/abc-123-def`
- Share token: `abc-123-def`
- Raw JSON: Complete credential JSON object

## 🏢 Admin Portal

### Accessing Admin Portal

1. Navigate to `/admin/login`
2. Login with admin credentials
3. You'll be redirected to `/admin/dashboard`

### Verifying Credentials (Admin)

1. In the admin dashboard, paste credential data in the input field
2. Accepted formats:
   - Share link: `/verify/abc-123`
   - Share token: `abc-123`
   - Raw JSON: Complete credential JSON
3. Click **"Verify"**
4. View detailed verification results:
   - **Verification Status**: Valid/Invalid
   - **Credential Details**: Title, Type, Issuer, Dates, Status
   - **Verification Checks**: Signature, Expiration, Issuer Trust, Proof
   - **Document Data**: All credential subject fields
   - **Document Links**: Image and document URLs (if available)

### Verification Checks

The system performs the following checks:
- ✅ **Cryptographic Signature**: Verifies the credential signature
- ✅ **Not Expired**: Checks if credential is still valid
- ✅ **Issuer Trusted**: Validates issuer authenticity
- ✅ **Proof Verified**: Verifies the cryptographic proof

## 📝 Credential Management

### Credential Types

**Template-Based Credentials:**
- **Educational**: Degree, major, institution, graduation year
- **Government ID**: ID number, issuing authority, issue date
- **Employment**: Company, position, start date, salary

**Custom Credentials:**
- Fully customizable fields
- User-defined issuer
- Custom data structure
- Optional image/document URLs

### Credential Fields

- **Title**: Credential name
- **Type**: Credential category
- **Issuer**: Who issued the credential (user-defined)
- **Issued Date**: When credential was issued (optional)
- **Expires Date**: When credential expires (optional)
- **Status**: verified/pending/expired
- **Credential Subject**: All credential data
- **Share Token**: Unique token for sharing
- **Image URL**: Link to credential image (optional)
- **Document URL**: Link to supporting document (optional)

## ✅ Verification Process

### How Verification Works

1. **Input Parsing**: System accepts share link, token, or raw JSON
2. **Credential Lookup**: Finds credential in database
3. **Signature Verification**: Validates cryptographic signature
4. **Expiration Check**: Verifies credential hasn't expired
5. **Issuer Validation**: Checks issuer authenticity
6. **Proof Verification**: Validates cryptographic proof
7. **Status Check**: Ensures credential status is "verified"
8. **Result**: Returns comprehensive verification result

### Verification Result Structure

```json
{
  "isValid": true,
  "credential": {
    "id": "...",
    "title": "...",
    "type": "...",
    "issuer": "...",
    "issuedAt": "...",
    "expiresAt": "...",
    "status": "verified",
    "credentialSubject": {...},
    "imageUrl": "...",
    "documentUrl": "..."
  },
  "details": {
    "signatureValid": true,
    "notExpired": true,
    "issuerTrusted": true,
    "proofVerified": true,
    "statusVerified": true
  },
  "timestamp": "..."
}
```

## 🎨 UI/UX Features

- **Responsive Design**: Works on mobile, tablet, and desktop
- **Dark Mode**: Toggle between light and dark themes
- **Modern Components**: Built with Radix UI and Tailwind CSS
- **Accessible**: ARIA labels and keyboard navigation
- **Loading States**: Clear feedback during operations
- **Error Handling**: User-friendly error messages
- **Toast Notifications**: Success and error notifications

## 🔒 Security Features

- **Supabase Authentication**: Secure user authentication
- **Session Management**: Express sessions with secure cookies
- **Password Hashing**: bcryptjs for password security
- **Cryptographic Signatures**: Secure credential signing
- **Input Validation**: Zod schema validation
- **SQL Injection Protection**: Drizzle ORM parameterized queries
- **CORS Protection**: Configured CORS settings

## 🧪 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run check` - Type check TypeScript
- `npm run db:push` - Push database schema

### Code Structure

- **TypeScript**: Full type safety
- **ESLint**: Code linting (if configured)
- **Prettier**: Code formatting (if configured)
- **Component-based**: Reusable React components

## 🐛 Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check database credentials

### Supabase Authentication Issues
- Verify Supabase credentials in `.env`
- Check Supabase project is active
- Ensure email confirmation is enabled

### Session Issues
- Clear browser cookies
- Check `SESSION_SECRET` is set
- Verify session middleware is configured

### Build Issues
- Delete `node_modules` and reinstall
- Clear build cache
- Check Node.js version (v18+)

## 📄 License

MIT License - see LICENSE file for details

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

For questions or support, please open an issue on the repository.

---

**Built with ❤️ using React, TypeScript, Express, and Supabase**


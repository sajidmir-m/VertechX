# Decentralized Digital Identity & Credential Vault

## Overview

This is a blockchain-based decentralized identity and credential management system that implements Web3 self-sovereign identity principles. The application allows users to create and manage Decentralized Identifiers (DIDs), store and verify credentials using cryptographic proofs, and maintain complete ownership of their digital identity.

The system leverages blockchain concepts, IPFS for decentralized storage, and zero-knowledge proofs for selective disclosure of credential information. Users can create verifiable credentials (educational certificates, government IDs, professional licenses, etc.), share them with selective disclosure, and verify credentials cryptographically without relying on centralized authorities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool

**UI Component Library**: Radix UI primitives with shadcn/ui design system
- **Rationale**: Provides accessible, unstyled components that can be customized while maintaining accessibility standards crucial for credential management applications
- **Design approach**: Material Design with security-focused customizations, inspired by cryptocurrency wallets and enterprise security dashboards

**Styling**: Tailwind CSS with custom design tokens
- Custom color system with semantic tokens for different credential states (verified, pending, expired, revoked)
- Typography system: Inter for UI, IBM Plex Mono for technical data (DIDs, hashes, addresses)
- Glassmorphism effects and elevation system for trust-building visual hierarchy

**State Management**: TanStack Query (React Query) for server state
- Handles credential fetching, DID management, and verification workflows
- Optimistic updates for credential operations

**Routing**: Wouter (lightweight client-side routing)
- Main routes: Landing, Dashboard, Wallet (DID management), Credentials, Verify, Settings

**Key UI Patterns**:
- Sidebar navigation with collapsible mobile view
- Credential cards with status indicators and action menus
- Modal dialogs for credential details, selective disclosure, and verification results
- Activity feed showing cryptographic operations timeline

### Backend Architecture

**Runtime**: Node.js with Express.js

**Language**: TypeScript with ES modules

**API Structure**: RESTful API with the following endpoints:
- `/api/did/*` - DID creation and retrieval
- `/api/credentials/*` - Credential CRUD operations and selective disclosure
- `/api/verify` - Cryptographic verification of credentials
- `/api/activities` - Activity logging and retrieval

**Cryptography Module** (`server/crypto.ts`):
- ECDSA key pair generation using P-256 curve (Web Crypto API)
- DID generation using SHA-256 hash of public keys
- Digital signature creation and verification for credentials
- IPFS CID generation for decentralized content addressing
- Zero-knowledge proof generation for selective disclosure

**Storage Abstraction** (`server/storage.ts`):
- Interface-based storage layer for DID, credential, verification, IPFS content, and activity operations
- Designed to support multiple backend implementations (in-memory, database)
- Supports credential templates for different types (Educational, Government ID, Employment, etc.)

**Validation**: Zod schemas for request validation
- CreateCredentialRequest: type, title, issuer validation
- SelectiveDisclosureRequest: credential ID and field selection
- VerifyCredentialRequest: credential data validation

### Data Storage

**Database**: PostgreSQL via Neon serverless adapter

**ORM**: Drizzle ORM with Drizzle Kit for migrations

**Schema Design** (6 core tables):

1. **dids** - Decentralized Identifiers
   - Stores DID string, public/private key pairs, method (did:key), metadata (blockchain, network)
   - Private keys stored (would be encrypted in production)

2. **users** - User accounts
   - Username/password authentication
   - Reference to current active DID

3. **credentials** - Verifiable Credentials
   - Links to DID, stores type, title, issuer information
   - Contains credential subject (flexible JSON), proof, IPFS CID
   - Status tracking (verified, pending, expired, revoked)

4. **verifications** - Verification records
   - Links credentials to verifiers with results
   - Stores verification method and metadata

5. **ipfs_content** - IPFS content mapping
   - Maps CID to content and metadata for decentralized storage

6. **activities** - Activity log
   - Tracks all operations (DID created, credential issued/verified/shared/revoked)
   - Linked to DIDs with metadata

**Migration Strategy**: Drizzle Kit with PostgreSQL dialect
- Schema defined in `shared/schema.ts` for type sharing between frontend/backend
- Push-based migrations via `npm run db:push`

### Authentication & Authorization

Currently implements basic username/password authentication with session management (connect-pg-simple for PostgreSQL session storage). Users are linked to DIDs, and operations are authorized based on DID ownership.

**Future considerations**: The architecture supports extending to blockchain wallet-based authentication (MetaMask integration) for true self-sovereign identity.

### Design System

**Color System**:
- Semantic tokens for credential states (verified: green, pending: yellow, expired: orange, revoked: red)
- Light/dark mode support with CSS custom properties
- Elevation system using subtle shadows and backdrop blur

**Component Architecture**:
- Atomic design approach with base components in `client/src/components/ui`
- Feature components: CredentialCard, DidDisplay, ActivityFeed, SelectiveDisclosureDialog
- Consistent use of Radix UI primitives for accessibility

**Typography**:
- Hero/Headers: Inter 600-700, 32-48px (desktop), 24-32px (mobile)
- Body: Inter 400, 16px with 1.6 line-height
- Technical data: IBM Plex Mono 400, 14px for DIDs, hashes, signatures

## External Dependencies

### Third-Party Services

**Neon Database** (@neondatabase/serverless):
- Serverless PostgreSQL database provider
- Connection via DATABASE_URL environment variable
- Used for all persistent storage (DIDs, credentials, verifications, activities)

**IPFS Integration** (planned):
- Decentralized file storage for credential documents
- CID generation implemented in crypto module
- Actual IPFS network integration pending

**Blockchain Integration** (planned):
- DID anchoring on Ethereum or other blockchain networks
- Smart contract integration for credential revocation lists
- Currently simulated with metadata fields

### UI Component Libraries

**Radix UI** (@radix-ui/*):
- Complete suite of accessible, unstyled primitives
- 20+ components: Dialog, Dropdown Menu, Popover, Tabs, Toast, etc.
- Provides keyboard navigation and ARIA compliance

**shadcn/ui Configuration**:
- New York style variant
- Neutral base color with CSS variables
- Custom component aliases for path resolution

### Data & Forms

**TanStack Query** (@tanstack/react-query):
- Server state management with caching
- Automatic refetching and optimistic updates
- Query invalidation for credential operations

**React Hook Form** with Zod resolvers:
- Form validation and state management
- Schema-based validation using Zod
- Integration with Radix UI form components

### Styling & Utilities

**Tailwind CSS**:
- Utility-first styling with custom configuration
- Custom spacing, color, and typography scales
- JIT compilation for optimized builds

**Additional Utilities**:
- clsx + tailwind-merge (cn helper)
- class-variance-authority for component variants
- date-fns for date formatting

### Development Tools

**Vite**:
- Fast development server with HMR
- Build tool for production bundles
- Replit-specific plugins for runtime error overlay and cartographer

**TypeScript**:
- Strict mode enabled
- Path aliases for clean imports (@/, @shared/, @assets/)
- Shared types between frontend and backend

### Cryptography

**Node.js Web Crypto API**:
- ECDSA key generation with P-256 curve
- Digital signatures for credential proofs
- SHA-256 hashing for DID generation

**Future considerations**: Integration with blockchain libraries (ethers.js, web3.js) for actual blockchain interactions and smart contract deployment.
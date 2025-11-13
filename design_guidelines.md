# Design Guidelines: Decentralized Digital Identity & Credential Vault

## Design Approach

**Design System Approach**: Material Design with security-focused customizations
- Rationale: Professional credential management requires clarity, trust, and established patterns that users recognize from banking and security applications
- Primary inspiration: Cryptocurrency wallets (MetaMask, Coinbase), enterprise security dashboards, and government digital services
- Key principle: **Trust through transparency** - make cryptographic operations visible but understandable

## Typography System

**Font Stack**: Inter (primary), IBM Plex Mono (technical data)
- Hero/Headers: Inter 600-700, 32-48px (desktop), 24-32px (mobile)
- Section Titles: Inter 600, 20-24px
- Body Text: Inter 400, 16px with 1.6 line-height
- Technical Data (DIDs, hashes, addresses): IBM Plex Mono 400, 14px
- Labels/Metadata: Inter 500, 12-14px, uppercase with letter-spacing
- Button Text: Inter 600, 14-16px

## Layout System

**Spacing Primitives**: Use Tailwind units of 4, 6, 8, 12, 16, 24
- Component padding: p-6 to p-8
- Section spacing: py-16 to py-24
- Card gaps: gap-6
- Element spacing: space-y-4, space-x-4

**Grid System**:
- Dashboard layout: 12-column grid with sidebar
- Credential cards: 2-column grid (lg:grid-cols-2), single column mobile
- Max container width: max-w-7xl for dashboard, max-w-4xl for forms

## Component Library

### Navigation & Layout
**Top Navigation Bar**:
- Fixed header with glassmorphism effect (backdrop-blur)
- Logo left, wallet address (truncated) center-right, profile dropdown right
- Height: h-16
- Connection status indicator (green dot for connected blockchain)

**Sidebar Navigation** (Dashboard views):
- Width: w-64 fixed on desktop, collapsible on mobile
- Navigation items with icons (wallet, credentials, verification, settings)
- Active state: filled background, bold text
- Bottom section: network status, gas fees indicator

### Core Dashboard Components

**Credential Card**:
- Rounded corners (rounded-xl), elevated shadow
- Header: Credential type badge, issuer logo placeholder
- Body: Credential title, issue date, expiration date
- Footer: Status indicator (verified/pending/expired), action menu
- Dimensions: Min-height of h-48, responsive width
- Include subtle document watermark background pattern

**DID Display Component**:
- Full DID string in monospace font, truncated with copy button
- QR code representation (right side or modal)
- Key fingerprint visualization
- "Created on [blockchain]" metadata

**Verification Badge System**:
- Checkmark shield icon for verified credentials
- Warning triangle for expired/revoked
- Clock icon for pending verification
- Size: 20x20px icons with adjacent text labels

### Interactive Elements

**Primary Actions**:
- Large pill-shaped buttons (rounded-full)
- Minimum height: h-12
- Icon + text combinations
- Floating action button (bottom-right) for "Add Credential"

**Secondary Actions**:
- Ghost buttons with borders
- Icon-only buttons for menus and actions
- Dropdown menus with dividers and icons

**Form Components**:
- Floating labels for inputs
- Input groups with prefix icons (lock, key, document)
- File upload with drag-drop zone (dashed border, upload icon)
- Multi-step form progress indicator (stepper component)

### Data Display

**Credential Table** (Alternative view):
- Sortable columns: Name, Type, Issuer, Date, Status
- Row actions: View, Share, Revoke
- Pagination footer
- Density toggle (compact/comfortable)

**Activity Feed**:
- Timeline layout with timestamps
- Activity type icons (issued, verified, shared, revoked)
- Expandable details
- Reverse chronological order

**Verification Flow**:
- Step-by-step wizard interface
- Progress bar at top
- Large central card for current step
- Previous/Next navigation buttons
- Summary review screen before submission

### Modals & Overlays

**Credential Detail Modal**:
- Full credential metadata display
- Tabbed interface: Overview, Cryptographic Proof, History
- Action buttons: Share, Download, Revoke
- Close button (top-right X)

**Selective Disclosure Interface**:
- Checkbox list of credential attributes
- Preview pane showing what will be shared
- Generate proof button
- Warning text about privacy implications

**Confirmation Dialogs**:
- Centered modal with icon (warning/info)
- Clear heading and description
- Two-button layout (Cancel/Confirm)
- Critical actions in red accent

## Specialized Components

**Cryptographic Signature Visualizer**:
- Hash display with character grouping (4-character segments)
- Signature verification status animation
- Blockchain transaction link
- Copy-to-clipboard functionality

**IPFS Content Display**:
- Content ID (CID) display with icon
- Gateway link
- File metadata (size, type, upload date)
- Preview thumbnail for documents

**Zero-Knowledge Proof Generator**:
- Attribute selector interface
- Proof generation progress indicator
- Generated proof display (monospace)
- QR code export option

**Network Status Panel**:
- Current blockchain network badge
- Block height ticker
- Gas price indicator
- Connection latency (green/yellow/red)

## Page Layouts

### Landing Page
- Hero section with security-focused headline and 3D lock illustration
- Feature grid: 3-column layout showcasing DID, VC, IPFS capabilities
- How It Works: 4-step process with numbered icons
- Trust indicators: blockchain logos, W3C standards badge
- CTA: "Create Your Identity Wallet" button

### Dashboard Home
- Welcome header with wallet summary
- Quick stats cards: Total Credentials, Verified Count, Recent Activity
- Recent credentials grid (4 cards)
- Activity timeline sidebar

### Credential Vault
- Filter/sort toolbar (top)
- Grid view of all credentials
- Empty state: illustration with "Add your first credential" CTA
- Floating add button

### Verification Portal
- Two-column layout: Upload credential left, verification results right
- Drag-drop upload zone
- Real-time verification progress
- Result display with cryptographic proof details

## Images

**Hero Section**: 
- Large, modern 3D illustration of a digital vault or lock with blockchain nodes connecting
- Placed as background with gradient overlay for text readability
- Alternative: Abstract geometric pattern representing cryptographic security

**Feature Illustrations**:
- Custom icons for DID (fingerprint/ID card hybrid)
- VC representation (certified document with ribbon)
- IPFS visual (distributed node network)
- Each 64x64px minimum

**Empty States**:
- Friendly illustrations for "No credentials yet"
- Document upload illustration for verification portal
- 200-300px width centered illustrations

## Accessibility

- All interactive elements: min 44px touch targets
- Form inputs: clear labels, error states with icons and text
- Keyboard navigation: visible focus states with ring offset
- ARIA labels for all icon buttons
- Color contrast: minimum 4.5:1 for all text
- Screen reader announcements for verification status changes

## Responsive Behavior

- Mobile: Single column, collapsible sidebar becomes bottom drawer
- Tablet: 2-column credential grid, condensed sidebar
- Desktop: Full 3-column grid, persistent sidebar
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
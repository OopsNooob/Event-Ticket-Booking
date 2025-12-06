# Ticketr - Real-time Event Ticketing Platform (Fork)

> **Note**: This is a forked repository from the original [Zero to Full Stack Hero Course Project](https://www.papareact.com/course). This version includes significant enhancements and new features beyond the original implementation.

A modern, real-time event ticketing platform built with Next.js 15, Convex, Clerk, and Nodemailer. Features a sophisticated queue system, real-time updates, role-based access control, and email ticket delivery.

## 🆕 New Features & Enhancements (Fork-Specific)

### Role-Based Access Control System
- 👥 **User Role**: Can only browse events and purchase tickets
- 🎭 **Event Organizer Role**: Can only create and manage events
- 🔒 **Role Validation**: Automatic checks prevent conflicts
  - Users with purchased tickets cannot become organizers
  - Organizers with created events cannot become users
- ⚙️ **Settings Page**: Easy role switching with real-time validation
- 🛡️ **Admin Panel**: Restricted migration tools for data management

### Email Ticket Delivery
- 📧 **Nodemailer Integration**: Email tickets with QR codes using Gmail SMTP
- 🎫 **Automated Sending**: Tickets sent immediately after purchase
- 📷 **QR Code Generation**: Each ticket includes a unique QR code
- 💾 **Ticket Download**: Users can download tickets as PNG images

### Enhanced Location Management
- 🗺️ **Leaflet Map Integration**: Interactive map for location selection
- 📍 **Click-to-Select**: Click anywhere on the map to set event location
- 🔍 **Reverse Geocoding**: Automatic address lookup from coordinates
- 🌐 **OpenStreetMap**: Free map tiles without API keys

### Improved Ticket Management
- 🎴 **Card Grid Layout**: Beautiful ticket cards with event images
- 🔍 **Search Functionality**: Search tickets by event name, location, or ID
- 📊 **Modal Details**: Click tickets to view detailed information
- ⏰ **Auto-Update Status**: Expired tickets automatically marked
- 💾 **Image Download**: Download tickets as PNG with QR codes

### Seller Dashboard Enhancements
- 📈 **Real-time Stats**: Accurate ticket sold counts
- 👥 **Buyer List**: View all ticket purchasers for each event
- 📋 **Tabs Navigation**: Separate upcoming and past events
- 🔄 **Live Updates**: Real-time synchronization with Convex

### Data Migration Tools
- 🔧 **Admin Migration Page**: Tools for role assignment and data cleanup
- 🔄 **Automatic Role Assignment**: Assign roles based on user behavior
- 🗑️ **Conflict Resolution**: Delete conflicting tickets from organizers
- 📊 **Status Dashboard**: Overview of users, roles, and tickets
- 🛡️ **Admin-Only Access**: Restricted to specific admin email

## Original Features

### For Event Attendees

- 🎫 Real-time ticket availability tracking
- ⚡ Smart queuing system with position updates
- 🕒 Time-limited ticket offers
- 📱 Mobile-friendly ticket management
- 📲 Digital tickets with QR codes
- 💸 Automatic refunds for cancelled events

### For Event Organizers

- 📊 Real-time sales monitoring
- 🎯 Automated queue management
- 📈 Event analytics and tracking
- 🔄 Automatic ticket recycling
- 🎟️ Customizable ticket limits
- ❌ Event cancellation with automatic refunds
- 🔄 Bulk refund processing

### Technical Features

- 🚀 Real-time updates using Convex
- 👤 Authentication with Clerk
- 🌐 Server-side and client-side rendering
- 🎨 Modern UI with Tailwind CSS and shadcn/ui
- 📱 Responsive design
- 🛡️ Rate limiting for queue joins and purchases
- 🔒 Automated fraud prevention
- 🔔 Toast notifications for real-time feedback
- ✨ Beautiful, accessible components with shadcn/ui

### UI/UX Features

- 🎯 Instant feedback with toast notifications
- 🎨 Consistent design system using shadcn/ui
- ♿ Fully accessible components
- 🎭 Animated transitions and feedback
- 📱 Responsive design across all devices
- 🔄 Loading states and animations
- 💫 Micro-interactions for better engagement

## Getting Started

### Prerequisites

- Node.js 18+
- npm/yarn
- Clerk Account
- Convex Account

### Environment Variables

Create a `.env.local` file with:

```bash
# Convex
NEXT_PUBLIC_CONVEX_URL=your_convex_url

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email Configuration (New)
GMAIL_USER=your_gmail_address@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password

# Optional: Resend API (if using Resend instead of Gmail)
RESEND_API_KEY=your_resend_api_key
```

**Note on Email Setup:**
- For Gmail SMTP: Use [Google App Passwords](https://support.google.com/accounts/answer/185833)
- For Resend: Get API key from [Resend Dashboard](https://resend.com/)

### Installation

```bash
# Clone the repository
git clone https://github.com/OopsNooob/Event-Ticket-Booking

# Install dependencies
npm install

# Install additional dependencies for new features
npm install nodemailer qrcode leaflet react-leaflet html2canvas

# Note: Use --legacy-peer-deps if needed for Leaflet
npm install leaflet react-leaflet --legacy-peer-deps

# Start the development server
npm run dev

# In a separate terminal, start Convex
npx convex dev
```

### Setting up Clerk

1. [Create a Clerk application by Clicking here!](https://go.clerk.com/34AwsuT)
2. Configure authentication providers
3. Set up redirect URLs
4. Add environment variables

### Setting up Convex

1. [Create a Convex account by Clicking here!](https://convex.dev/c/sonnysangha)
2. Create a new project
3. Install the Convex CLI:
   ```bash
   npm install convex
   ```
4. Initialize Convex in your project:
   ```bash
   npx convex init
   ```
5. Copy your deployment URL from the Convex dashboard and add it to your `.env.local`:
   ```bash
   NEXT_PUBLIC_CONVEX_URL=your_deployment_url
   ```
6. Start the Convex development server:
   ```bash
   npx convex dev
   ```

Note: Keep the Convex development server running while working on your project. It will sync your backend functions and database schema automatically.

### Setting up UI Components

1. Install shadcn/ui CLI:

   ```bash
   npx shadcn-ui@latest init
   ```

2. Install required components:

   ```bash
   npx shadcn-ui@latest add toast
   npx shadcn-ui@latest add button
   npx shadcn-ui@latest add card
   npx shadcn-ui@latest add dialog
   ```

3. Configure toast notifications in your layout:
   ```bash
   npx shadcn-ui@latest add toaster
   ```

## Architecture

### Database Schema (Updated)

- **Events**: Event details with location coordinates
- **Tickets**: Ticket records with status tracking
- **Waiting List**: Queue management
- **Users**: User profiles with role field (user/organizer)
- **Payments**: Payment transaction records

### New Schema Changes
```typescript
// Users table now includes role field
users: {
  userId: string,
  email: string,
  name?: string,
  role?: "user" | "organizer"  // NEW: Role-based access control
}

// Events table includes coordinates for map
events: {
  // ... existing fields
  location: string  // Can store coordinates from map selection
}
```

### Key Components

**Original:**
- Real-time queue management
- Rate limiting
- Automated offer expiration
- Payment processing
- User synchronization

**New Components:**
- **RoleGuard**: Route protection based on user roles
- **LeafletLocationPicker**: Interactive map for location selection
- **Email Service** (`lib/email.ts`): Nodemailer integration for ticket delivery
- **Migration Tools** (`convex/migrations.ts`): Admin tools for data management
- **Enhanced Ticket View**: Card-based layout with search and download

## Usage

### Creating an Event

1. Sign up as an event organizer
2. Create event with details and ticket quantity
3. Publish event

### Purchasing Tickets

1. Browse available events
2. Join queue for desired event
3. Receive ticket offer
4. Complete purchase within time limit
5. Access digital ticket with QR cod

## Join the worlds best developer course & community Zero to Full Stack Hero! 🚀

### Want to Master Modern Web Development?

This project was built as part of the [Zero to Full Stack Hero 2.0](https://www.papareact.com/course) course, taught by Sonny Sangha. Join thousands of developers and learn how to build projects like this and much more!

#### What You'll Get:

- 📚 Comprehensive Full Stack Development Training
- 🎯 50+ Real-World Projects
- 🤝 Access to the PAPAFAM Developer Community
- 🎓 Weekly Live Coaching Calls with Sonny
- 🤖 AI & SaaS Development Modules
- 💼 Career Guidance & Interview Prep

#### Course Features:

- Lifetime Access to All Content
- Live Coaching Sessions
- Private Discord Community
- AI Mastery Module
- SaaS Development Track
- And much more!

[Join Zero to Full Stack Hero Today!](https://www.papareact.com/course)

## Support

For support, email team@papareact.com

---

Built with ❤️ for the PAPAFAM

### Handling Refunds and Cancellations

1. Event organizers can cancel events from their dashboard
2. System automatically processes refunds for all ticket holders
3. Refund status can be tracked in user dashboard

### User Experience

1. Real-time Feedback

   - Instant purchase confirmations
   - Queue position updates
   - Error notifications
   - Success page
   - Ticket status

2. Interactive Elements
   - Animated buttons and cards
   - Loading states
   - Progress indicators
   - Skeleton loaders
   - Smooth transitions

## 📝 Detailed Changes from Original Repository

### 1. Role-Based Access Control
**Files Added/Modified:**
- `convex/schema.ts`: Added `role` field to users table
- `convex/users.ts`: Added `getUserRole`, `canSwitchRole`, `updateUserRole`
- `components/RoleGuard.tsx`: NEW - Route protection component
- `app/settings/page.tsx`: NEW - Role switching interface
- `ROLE_IMPLEMENTATION.md`: NEW - Complete documentation

**Features:**
- Separate User and Event Organizer roles
- Validation prevents conflicts (users with tickets can't become organizers, vice versa)
- Protected routes for seller pages and ticket pages
- Dynamic header navigation based on role

### 2. Email Ticket Delivery
**Files Added/Modified:**
- `lib/email.ts`: NEW - Nodemailer configuration with Gmail SMTP
- `app/actions/sendTicketEmail.ts`: NEW - Server action for sending emails
- `app/actions/purchaseTicket.ts`: Modified to trigger email after purchase
- `convex/events.ts`: Updated `purchaseTicket` to return `ticketId`

**Features:**
- Automatic email sending after ticket purchase
- QR code generation and embedding
- Configurable Gmail SMTP or Resend API
- Detailed logging for debugging

### 3. Interactive Map Location Selection
**Files Added/Modified:**
- `components/LeafletLocationPicker.tsx`: NEW - Map component with Leaflet
- `components/EventForm.tsx`: Modified to use map picker
- `package.json`: Added leaflet, react-leaflet dependencies

**Features:**
- Click anywhere on map to select location
- Reverse geocoding for address lookup
- OpenStreetMap tiles (no API key required)
- Mobile-responsive map interface

### 4. Enhanced Ticket Management UI
**Files Modified:**
- `app/tickets/page.tsx`: Complete redesign with card grid
- `app/tickets/[id]/page.tsx`: Ticket detail view
- `components/TicketCard.tsx`: Reusable ticket card component

**Features:**
- Card-based layout with event images
- Search by event name, location, or ticket ID
- Modal for detailed ticket view
- Download ticket as PNG with QR code
- Auto-update expired tickets
- Status badges (valid, used, expired)

### 5. Seller Dashboard Improvements
**Files Added/Modified:**
- `app/seller/events/page.tsx`: Modified with tabs for upcoming/past events
- `app/seller/events/EventList.tsx`: NEW - Event list component
- `app/seller/events/[id]/page.tsx`: NEW - Event details with buyer list
- `convex/events.ts`: Added `getEventById`, `getSellerEventsWithStats`
- `components/ui/tabs.tsx`: NEW - Custom tabs component

**Features:**
- Real-time ticket sold counts (fixed from showing 0)
- View all ticket buyers for each event
- Separate tabs for upcoming and past events
- Click events to see detailed information

### 6. Admin Migration Tools
**Files Added:**
- `app/admin/migration/page.tsx`: NEW - Admin dashboard for data management
- `convex/migrations.ts`: NEW - Migration functions
- `components/Header.tsx`: Modified to show Admin button for authorized email

**Features:**
- Auto-assign roles based on user behavior (created events = organizer)
- Delete conflict tickets (organizers with purchased tickets)
- View users without roles
- Statistics dashboard
- Restricted access to admin email only

### 7. Bug Fixes & Improvements
- Fixed TypeScript errors with `ticketId` return type
- Fixed image display using `useStorageUrl` hook
- Fixed ticket sold count showing 0 (now uses real-time query)
- Added proper SSR handling for map components
- Improved error handling and user feedback

### 8. Dependencies Added
```json
{
  "nodemailer": "^6.9.x",
  "qrcode": "^1.5.x",
  "leaflet": "^1.9.x",
  "react-leaflet": "^4.2.x",
  "html2canvas": "^1.4.x"
}
```

## 🔄 Migration Guide (For Existing Users)

If you're migrating from the original repository:

1. **Update Environment Variables**: Add Gmail credentials
2. **Update Schema**: Run Convex migration to add role field
3. **Assign Roles**: Use admin migration page to assign roles
4. **Clean Conflicts**: Delete any conflict tickets
5. **Test**: Verify role-based access works correctly

## 🤝 Contributing

This is a fork with custom enhancements. To contribute:

1. Fork this repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

Same as original repository. Built as an educational project based on the Zero to Full Stack Hero course.

## 🙏 Credits

- **Original Course**: [Zero to Full Stack Hero 2.0](https://www.papareact.com/course) by Sonny Sangha
- **Fork Maintainer**: OopsNooob
- **Enhancements**: Role-based access, email delivery, map integration, improved UI/UX

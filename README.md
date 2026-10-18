# Bookify

Bookify is a full-stack appointment-booking SaaS platform for service businesses such as salons, clinics, gyms, and wellness providers. The project combines a Node.js/Express backend with a React + Vite frontend to support business setup, staff and service management, appointment booking, payment handling, subscriptions, customer tracking, and dashboard analytics.

This repository contains the complete application stack for managing a business-facing scheduling workflow and a public booking experience.

## Overview

The product is structured around two main user flows:

- Business owner workflow: create/manage a business, add services and staff, define availability, review bookings, track customers, and monitor dashboard metrics.
- Customer workflow: browse public businesses, view service and availability data, book appointments, reschedule, and manage personal bookings.

The landing page and pricing flow show a SaaS model with plan-based access, while the backend enforces auth and subscription checks for protected business functionality.

## Core Features

- Business onboarding and profile management
- Service catalog management
- Staff management and staff-specific assignment
- Availability scheduling and slot generation
- Public booking pages by business slug
- Booking creation, cancellation, and reschedule flows
- Customer listing and customer booking history
- Dashboard overview with booking and revenue metrics
- Subscription plans and billing flow
- Payment integration support (Razorpay)
- Real-time notifications via Socket.IO
- File upload support for business logos and profile images using Cloudinary
- Email and SMS integrations through Nodemailer and Twilio

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- Redis for cache/availability support
- Socket.IO for live updates
- JWT for authentication
- bcryptjs for password hashing
- Cloudinary for media uploads
- Razorpay for payments
- Nodemailer for email delivery
- Twilio for SMS/communication features
- Helmet + CORS + rate limiting for request hardening

### Frontend
- React 19
- Vite
- React Router
- Axios for API calls
- React Hook Form + Zod validation
- date-fns for date utilities
- Recharts for charts and metrics
- Lucide React icons
- React Hot Toast for notifications

## Project Structure

```text
.
├── backend/
│   ├── config/          # DB, Redis, socket, and app configuration
│   ├── controllers/     # Request handlers for auth, bookings, businesses, etc.
│   ├── middleware/      # Auth, subscriptions, uploads, error handling
│   ├── models/          # Mongoose schemas for User, Business, Booking, etc.
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic and integrations
│   ├── utils/           # Helper utilities
│   ├── .env.example     # Sample backend env configuration
│   ├── package.json     # Backend dependencies and scripts
│   └── server.js        # Express app bootstrap
├── frontend/
│   ├── src/             # React app source
│   ├── public/          # Static assets
│   ├── .env.example     # Sample frontend env configuration
│   ├── package.json     # Frontend dependencies and scripts
│   └── vite.config.*    # Vite configuration
├── ISSUES.md            # Source-inspection findings and recommendations
├── PERFORMANCE.md       # Performance improvement checklist and guidance
├── .gitignore
└── README.md
```

## Main Functional Areas

### Authentication and user roles
The backend includes a user model with roles such as owner, staff, and customer. Authenticated routes are protected, and subscription checks are enforced for dashboard and booking-management screens.

### Business and subscription management
The app supports:
- creating and updating businesses
- subscription plan listing and active-plan checks
- gated dashboard access for subscribed owners
- business-specific routing and ownership validation

### Booking and scheduling logic
The booking system includes:
- available slot generation
- business/service/staff-specific availability results
- customer booking creation through public routes
- booking status updates, reschedules, and cancellations
- payment initiation and verification

### Public customer experience
Customers can browse businesses, select a service and date, view slot availability, and complete booking without being forced through an owner dashboard workflow.

### Reporting and monitoring
Dashboard routes expose summary metrics, revenue data, booking breakdowns, and popular service information.

## Environment Setup

### Requirements
- Node.js 18+
- MongoDB instance
- Redis instance
- A valid cloud storage service for uploads (Cloudinary is configured)
- Payment credentials for Razorpay
- Email provider credentials
- Optional Twilio credentials for SMS features

### Backend configuration
Copy the example file and update values:

```bash
cd backend
copy .env.example .env
```

Example configuration values:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/Bookify
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
EMAIL_FROM=Bookify <your_email@example.com>
CLIENT_URL=http://localhost:5173
```

The project also expects external service credentials for Cloudinary, Razorpay, and any communication providers used by your deployment.

### Frontend configuration
```bash
cd frontend
copy .env.example .env
```

Example:

```env
VITE_API_URL=http://localhost:3000/api
```

## Running the Project

### Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### Start the backend

```bash
cd backend
npm run dev
```

The backend runs with nodemon and starts the Express server on the configured port (default: 3000).

### Start the frontend

```bash
cd frontend
npm run dev
```

The Vite app typically runs on:

```text
http://localhost:5173
```

## Default App Flow

1. Sign up or log in as a business owner.
2. Create a business profile and activate a subscription plan.
3. Add services and staff.
4. Configure availability windows.
5. Publish the booking URL for public customers.
6. Receive bookings, update statuses, and monitor dashboard analytics.

## API Structure

The backend exposes public and protected API groups under `/api`:

- `/api/auth` — registration, login, password-related flows
- `/api/profile` — authenticated profile data
- `/api/subscriptions` — plan definitions and subscription status
- `/api/payments` — payment endpoints
- `/api/business` — business CRUD operations
- `/api/services` — service management
- `/api/staff` — staff management
- `/api/availability` — availability configuration
- `/api/slots` — slot generation logic
- `/api/customers` — customer management
- `/api/bookings` — booking operations and payment flow
- `/api/public` — public business lookup and booking actions
- `/api/dashboard` — overview and reporting data

## Documentation Included in the Repository

- [PERFORMANCE.md](./PERFORMANCE.md) — checklist of runtime and development-performance recommendations.
- [ISSUES.md](./ISSUES.md) — review notes on observed implementation issues and corresponding fixes.

These documents are useful when working on hardening, optimization, and production readiness.

## Notes

This repository is structured as a working SaaS application, but it also includes a review file that documents implementation concerns discovered during source inspection. Before deploying to production, review those notes and confirm that environment, auth, payment, and booking/business validation rules are hardened for your target deployment.

## Summary

Bookify is a complete business scheduling platform with:
- strong owner dashboard functionality
- public booking capabilities
- subscription-based access control
- MongoDB-backed business data modeling
- real-time booking support
- modern React frontend and Express backend

It is best suited for a growing service-based business that wants to manage scheduling, staff, availability, and payments in one SaaS-style product.

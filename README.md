# ClockMate: Precision Workforce Management

ClockMate is a professional, high-performance workforce management platform designed to bridge the gap between "work done" and "pay received." By integrating geofenced attendance tracking with a dynamic, enterprise-grade payroll engine, ClockMate eliminates administrative friction and ensures absolute accuracy in labor management.

## 🚀 Core Features

### 📍 Precise Attendance & Geofencing
*   **Geographical Boundary Enforcement**: Punch-in and punch-out events are only permitted within authorized company boundaries.
*   **Unique Session Management**: Prevents conflicting attendance entries by ensuring each staff member has exactly one active session at a time.
*   **Audit Trail**: Every shift is logged with precise timestamps and GPS coordinates for administrative verification.

### 💰 Enterprise Payroll Engine
*   **Automated Fortnightly Cycles**: One-click calculation of gross pay, tax withholdings, and net distributions.
*   **Custom Penalty Rates**: Supports complex Enterprise Agreements with configurable multipliers for Overtime, Evening, Night, and Public Holiday shifts.
*   **Smart Tax Calculation**: Automated PAYG withholding based on standardized tax brackets.

### 📂 Professional Reporting
*   **Digital Payslips**: High-fidelity PDF payslips generated instantly with company branding and detailed shift breakdowns.
*   **CSV Exports**: Downloadable datasets for attendance and payroll history, ready for integration with external accounting software.

### 📧 Automated Communications
*   **Live Notifications**: Automated welcome and invitation emails sent via secure Google SMTP infrastructure.
*   **Credential Management**: Secure transmission of system-generated login details for new organization members.

## 🛠️ Technical Stack
*   **Framework**: Next.js (App Router)
*   **Database**: MongoDB (Mongoose ODM)
*   **Communication**: Nodemailer (Google SMTP Integration)
*   **Security**: JWT Authentication & Bcrypt Hashing
*   **Interface**: Modern Responsive CSS & Framer Motion

## 🏗️ Installation & Setup

### 1. Prerequisites
Ensure you have the following installed:
*   Node.js (v18.0 or higher)
*   A MongoDB Atlas cluster or local MongoDB instance

### 2. Environment Configuration
Create a `.env` file in the root directory and populate it with the following:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
GOOGLE_EMAIL=your_gmail_address
GOOGLE_PASSWORD=your_google_app_password
APP_URL=http://localhost:3000
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to see the results.

## 🔄 Business Workflow

1.  **Organization Registration**: Register your company to create an Admin account.
2.  **Workforce Onboarding**: Admins invite employees via the dashboard; credentials are automatically emailed to the staff member.
3.  **Daily Operations**: Staff members use the geofenced dashboard to log their shifts in real-time.
4.  **Shift Verification**: Admins review, edit (if necessary), and approve shifts in the "Shift Approvals" queue.
5.  **Payroll Distribution**: Run the automated payroll sequence at the end of the fortnight to generate digital payslips and accounting records.

## 👥 The Development Team

ClockMate was engineered by a dedicated group of developers and system architects:

*   **Sumit Yadav** (s8117110) - Project Manager
*   **Rishav Neupane** (s8105118) - Lead Developer
*   **Kripa Neupane** (s8116642) - UI/UX Designer
*   **Prasanna Pandey** (s8107336) - System Architect

---
© 2026 ClockMate Workforce Management Systems.
# clockmate

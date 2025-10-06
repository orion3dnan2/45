# نظام عيادة الأسنان المتكامل - الكويت 🇰🇼

## Overview
This project is a comprehensive dental clinic management system designed for the Kuwaiti market. It caters to four main user roles: Doctors, Receptionists, Accountants, and Administrators, integrating patient records, appointments, treatments, invoicing, and payments. The system fully supports the Kuwaiti Dinar (KWD) and incorporates Kuwait's governorates and regions. The business vision is to provide a specialized, efficient, and secure clinic management solution tailored to the local market, enhancing operational efficiency and patient care.

## User Preferences
I prefer that the agent focuses on high-level feature implementation.
I want the agent to use clear and concise language.
I want the agent to prioritize security considerations in all development aspects.
I want the agent to ensure data privacy, especially regarding patient information.
I want the agent to ensure that all financial calculations are accurate and support the Kuwaiti Dinar.
I want the agent to adhere to the specified Kuwaiti settings for currency, regions, and payment methods.
I want the agent to strictly follow the defined roles and permissions for each user type.
I want the agent to ask for confirmation before making significant architectural changes.

## System Architecture
The system employs a full-stack architecture with a clear separation between frontend and backend.

**UI/UX Decisions:**
The system will feature a user-friendly interface designed for different user roles. Styling is component-based using inline CSS. The focus is on functionality and clarity, with future plans for professional UI/UX enhancements.

**Technical Implementations:**
*   **Backend:** Developed with Express.js, utilizing PostgreSQL (Neon) as the database. Authentication is managed via JWT (JSON Web Tokens) with secure keys, and bcryptjs is used for password encryption. The backend serves the frontend from its public directory.
*   **Frontend:** Built with React and Vite, using React Router for navigation.
*   **Security:** JWT_SECRET is protected in environment variables. Passwords are encrypted with bcrypt, and a robust role-based access control (RBAC) system ensures each role has specific, isolated permissions. Patient data is segregated, allowing doctors to view only their assigned patients.

**Feature Specifications:**
*   **Patient Management:** Comprehensive patient registration, medical history, case status tracking (new, active, completed, postponed, cancelled), and assignment of a `primary_doctor_id` for dedicated follow-up and data segregation.
*   **Appointment System:** Scheduling, status tracking (scheduled, confirmed, in-progress, completed, cancelled), and reminders, linked to treatments and invoices.
*   **Treatment Management:** Diagnosis, procedure recording (including tooth number), status tracking (planned, in-progress, completed, cancelled), medication usage, and cost calculation.
*   **Professional Invoicing:** Automatic invoice generation with multiple line items, support for taxes and discounts, various invoice statuses (draft, pending, paid, partially paid, overdue, cancelled), automatic linking to patients, treatments, and appointments, with automatic tracking of paid amounts and remaining balances.
*   **Advanced Payments:** Support for partial payments and diverse payment methods (cash, KNET, credit card, bank transfer, insurance), with payment references and automatic invoice status updates.
*   **Inventory & Medication:** Management of medicines and supplies, quantity tracking, low-stock alerts, minimum quantity settings, and expiry date tracking.
*   **Supplier Management:** Supplier information, subscription tracking, and expiry alerts.
*   **Smart Notifications:** Alerts for low stock, appointment reminders, supplier subscription expiry, and overdue payments.

**System Design Choices:**
The system is designed with specific Kuwaiti requirements in mind, including:
*   **Currency:** Kuwaiti Dinar (KWD / د.ك) with 3 decimal places (0.000).
*   **Regions:** Support for Kuwait's 6 governorates and their respective areas.
*   **Payment Methods:** Integration of local payment methods like KNET, alongside cash, credit card, bank transfer, and insurance.

**Roles and Permissions:**
*   **Reception:** Patient file management (CRUD), appointment scheduling and tracking, review of inventory/treatments/medications (read-only), supplier management (CRUD), payment recording, invoice/payment viewing, notification viewing.
*   **Doctor:** View only their assigned patients and appointments, record diagnoses, create/edit treatments, set treatment pricing, view inventory (read-only), track patient status, view notifications and invoices for their patients.
*   **Accountant:** Issue/edit invoices, collect/record payments, track payments, generate financial reports, view patient/appointment/treatment information (read-only).
*   **Admin:** Full system control, including complete CRUD operations for all modules (patients, appointments, treatments, inventory, suppliers, invoices, payments), user management, and access to all statistics and notifications.

## External Dependencies
*   **Database:** PostgreSQL (specifically Neon for managed hosting).
*   **Authentication:** JWT (JSON Web Tokens) for secure API authentication.
*   **Payment Gateways:** KNET (for local Kuwaiti electronic payments), Credit Card processing, Bank Transfer.
*   **NPM Packages:** Express.js, React, Vite, React Router, bcryptjs.
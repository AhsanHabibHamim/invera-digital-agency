# ROLE

You are acting as:

- Principal Software Architect
- Staff Backend Engineer
- Product Owner
- Technical Lead
- Senior Database Designer
- Enterprise Security Engineer
- API Designer
- Documentation Engineer

Your responsibility is NOT to simply generate code.

Your responsibility is to understand my COMPLETE project first, then design, improve and implement it like an enterprise-level Digital Agency ERP/CRM.

You must think like a senior engineer who has built large SaaS systems.

---

# FIRST TASK (VERY IMPORTANT)

DO NOT START CODING IMMEDIATELY.

FIRST READ EVERYTHING.

Read the ENTIRE project.

Read BOTH:

- Backend Project
- Client (Frontend) Project

Read every important file.

Understand:

- Existing Architecture
- Existing Features
- Existing APIs
- Existing Database
- Existing Workflows
- Existing Business Logic
- Existing User Flow
- Existing UI Flow
- Existing Dashboard
- Existing Documentation
- Docs Folder
- README
- Requirement Documents
- API Docs

Build a complete understanding first.

DO NOT assume anything.

If something is unclear, inspect the code.

---

# SECOND TASK

After reading everything,

perform a GAP ANALYSIS.

Find:

- Missing Features
- Missing APIs
- Missing Database Tables
- Missing Roles
- Missing Workflows
- Missing Dashboards
- Missing Security
- Missing Permissions
- Missing Business Logic
- Missing Notifications
- Missing CRM Features
- Missing Agency Features
- Missing Reports

Then create an implementation plan.

Backend comes FIRST.

Frontend comes AFTER backend is fully completed.

---

# PROJECT GOAL

I want this project to become a COMPLETE Digital Agency Management System.

Not just a website.

I want a complete Agency ERP + CRM + Client Portal + Team Management System.

Everything should be manageable from our own website.

---

# USER ROLES

Redesign the entire role system.

Current role system is NOT enough.

Implement proper enterprise RBAC.

Roles should include:

1. Super Admin
2. Admin
3. Developer
4. Team Member
5. Sales Executive
6. Marketing Executive
7. Project Manager
8. HR / Recruiter
9. Finance Manager
10. Support Executive
11. Client / User

Client/User is the default role after normal registration.

Developer can also register from registration page.

Registration page should allow role selection only for allowed public roles.

Example:

- Client/User
- Developer

All privileged roles must only be assignable by Super Admin.

---

# SUPER ADMIN

Super Admin controls EVERYTHING.

Super Admin should have:

- Full system access
- User management
- Role management
- Permission management
- Dynamic custom roles
- Dashboard management
- Feature toggles
- Environment management
- Activity logs
- Audit logs
- Database tools
- System settings
- Email settings
- Payment settings
- Notification settings
- Website settings
- CMS
- API Keys
- Analytics
- Reports
- Backup & Restore
- Global Search
- Security Management

Nothing should be restricted.

---

# CUSTOM ROLE SYSTEM

Do NOT hardcode permissions.

Build enterprise Role & Permission system.

Tables:

Roles

Permissions

RolePermissions

UserRoles

Support:

Create Role

Edit Role

Delete Role

Clone Role

Assign Permission

Remove Permission

Permission Groups

Module Permissions

Route Permissions

API Permissions

Dashboard Permissions

---

# USER PROFILE

Every internal team member should have:

Nickname

Profile Picture

Designation

Bio

Skills

Experience

Country

Timezone

Languages

Portfolio

GitHub

LinkedIn

Availability

Working Status

Department

Joining Date

Employee ID

---

# DASHBOARDS

Every role should have its own dashboard.

Example:

Super Admin Dashboard

Admin Dashboard

Developer Dashboard

Project Manager Dashboard

Sales Dashboard

Marketing Dashboard

Finance Dashboard

Support Dashboard

Client Dashboard

Dashboard widgets should be role-based.

---

# TEAM WORKFLOW

We are a small agency.

Everyone (except Client/User) should be able to hunt clients.

Everyone should have Lead Management access according to permissions.

---

# LEAD HUNTING CRM

Create a complete Lead Hunting CRM.

Each lead should include:

Lead ID

Contact Name

Company

Country

State

City

Industry

Email

Phone

WhatsApp

Website

Facebook

Instagram

LinkedIn

Twitter/X

YouTube

Source

Assigned To

Created By

Created Date

Status

Priority

Estimated Deal Value

Expected Close Date

Last Contact Date

Next Follow Up

Meeting Schedule

Tags

Notes

Requirements

Interested Services

Files

Attachments

Communication History

Call History

Email History

Meeting Notes

Activity Timeline

Lead Score

Probability %

Competitors

Decision Maker

Current Website

Website Quality

SEO Score

Social Presence Score

Potential Revenue

Currency

---

# LEAD STATUS

Examples:

New

Research

Contacted

Interested

Meeting Scheduled

Proposal Sent

Negotiation

Won

Lost

Not Interested

Follow Up

Cold

Hot

Warm

Custom Status

---

# LEAD PERMISSIONS

Super Admin

- Full Access

Admin

- Full Access

Developer / Team

- Can Create
- Can View Own
- Can Update Own
- Can Delete Own

Cannot modify other members' leads.

Cannot change global status unless permission exists.

Admin & Super Admin can:

Create

Read

Update

Delete

Assign

Merge

Export

Import

Bulk Actions

Status Change

---

# PROJECT MANAGEMENT

Improve project module.

Add:

Sprint

Task

Subtask

Kanban

Calendar

Timeline

Milestones

Bug Tracker

Issue Tracker

Comments

Time Tracking

Daily Logs

Developer Notes

Files

Version History

Approvals

---

# CLIENT PORTAL

Client should be able to:

Track Projects

Invoices

Quotes

Messages

Files

Meetings

Tickets

Payments

Approvals

Feedback

Reviews

Support

---

# SALES MODULE

Add:

Lead Pipeline

Sales Funnel

Proposal Generator

Quotation

Contract

Negotiation Tracker

Commission

Performance

Sales Target

---

# HR MODULE

Employees

Attendance

Leave

Recruitment

Interview

Payroll Ready Structure

---

# FINANCE MODULE

Expenses

Income

Transactions

Invoices

Quotes

Refunds

Reports

---

# SUPPORT MODULE

Ticket System

Live Chat Ready Structure

Priority

Categories

Assignments

Replies

Status

SLA

---

# NOTIFICATIONS

Real-time Notifications

Email Notifications

System Notifications

Role-based Notifications

---

# SECURITY

Enterprise security.

Implement:

Permission Middleware

Audit Logs

Security Logs

2FA Ready

Refresh Token Hashing

Rate Limit

CSRF

XSS Protection

SQL/NoSQL Injection Protection

Input Sanitization

File Validation

---

# DATABASE

Redesign database only where necessary.

Keep backward compatibility.

Avoid breaking existing APIs.

---

# API DESIGN

Every feature must have:

Validation

Controller

Service

Repository

Routes

Permission

Swagger Documentation

Error Handling

Tests Ready

---

# CODING RULES

Always follow:

SOLID

DRY

KISS

Clean Architecture

Repository Pattern

Reusable Services

Modular Design

Consistent Naming

Strict TypeScript

---

# BEFORE EVERY FEATURE

Before implementing:

1. Understand current implementation.
2. Check if similar feature already exists.
3. Reuse existing code whenever possible.
4. Never duplicate logic.

---

# DOCUMENTATION

This is VERY IMPORTANT.

Every time a feature is completed:

Update ALL documentation automatically.

Especially update everything inside the docs folder.

Update:

Requirements

Workflow

Architecture

ER Diagram

API Documentation

Feature List

Role List

Permission Matrix

Database Documentation

Project Structure

User Flow

Developer Notes

Change Log

Implementation Notes

Setup Guide

Deployment Guide

Every document must always match the latest source code.

---

# FINAL OBJECTIVE

The final system should feel like a mix of:

- HubSpot CRM
- ClickUp
- Jira
- Trello
- Monday.com
- Zoho CRM
- Notion
- Slack (internal communication)
- Stripe Dashboard (billing)
- GitHub Projects (developer workflow)

But customized specifically for a Digital Agency.

---

# FINAL INSTRUCTION

Never rush into coding.

Always:

1. Read Backend completely.
2. Read Client completely.
3. Read Docs completely.
4. Understand current architecture.
5. Identify missing features.
6. Improve backend first.
7. Only after backend is stable, start frontend updates.
8. After every completed feature, update the docs folder so that documentation always reflects the latest implementation.

Work like a senior engineer responsible for a production-grade SaaS platform. Every architectural decision should prioritize scalability, maintainability, security, and long-term growth.

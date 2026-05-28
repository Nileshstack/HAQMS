# HAQMS Engineering Evaluation Assignment Report

## Candidate

Nilesh Srivastava
(nileshsrivastava.software@gmail.com)

## Project

HAQMS — Hospital Appointment & Queue Management System

## Tech Stack

* Next.js
* Tailwind CSS
* Node.js + Express
* PostgreSQL
* Prisma ORM

---

# Overview

This assignment involved auditing and improving an intentionally vulnerable and inefficient hospital management system. The primary goal was to identify production-level issues related to security, backend performance, database design, concurrency, React rendering, and incomplete functionality.

The implementation focused on applying minimal, production-grade fixes while preserving the existing project architecture and user experience.

---

# Issues Identified & Fixes Implemented

## 1. JWT Expiration Bypass & Authentication Hardening

### Issue

JWT verification accepted expired or malformed tokens and used insecure verification behavior.

### Fix Implemented

* Removed `ignoreExpiration: true`
* Enforced JWT expiration validation
* Required `JWT_SECRET` from environment variables
* Explicitly constrained JWT verification to `HS256`
* Hardened bearer token parsing and validation

### Files Affected

* `backend/src/middleware/auth.js`
* `backend/src/routes/auth.js`

### Impact

This prevented authentication bypasses, malformed token abuse, and insecure fallback behavior.

---

## 2. Authorization Bypass Vulnerability

### Issue

Sensitive routes did not properly enforce role-based authorization.

### Fix Implemented

* Restricted appointment booking routes to `ADMIN` and `RECEPTIONIST`
* Restricted queue check-ins to `ADMIN` and `RECEPTIONIST`
* Restricted queue status updates to `DOCTOR` and `ADMIN`
* Fixed `authorizeAdminOnlyLegacy` middleware to correctly validate admin roles

### Files Affected

* `backend/src/middleware/auth.js`
* `backend/src/routes/appointments.js`
* `backend/src/routes/queue.js`
* `backend/src/routes/patients.js`

### Impact

Prevents unauthorized access to sensitive hospital operations.

---

## 3. Credential Leakage & Sensitive Logging

### Issue

Passwords and request payloads were being logged or exposed in API responses.

### Fix Implemented

* Removed password and request-body logging
* Prevented password hashes from being returned during registration
* Removed internal stack traces and raw database errors from API responses

### Files Affected

* `backend/src/routes/auth.js`
* `backend/index.js`

### Impact

Reduced risk of credential leakage and internal system disclosure.

---

## 4. SQL Injection Vulnerability

### Issue

Doctor search functionality used unsafe raw SQL string interpolation.

### Fix Implemented

* Replaced `prisma.$queryRawUnsafe()` with safe Prisma query filters using `findMany()`

### Files Affected

* `backend/src/routes/doctors.js`

### Impact

Eliminated SQL injection attack vectors.

---

## 5. Backend N+1 Query Optimization

### Issue

Appointments endpoint executed additional database queries inside loops.

### Fix Implemented

* Replaced loop-based querying with Prisma `include` relations

### Files Affected

* `backend/src/routes/appointments.js`

### Impact

Reduced database load and improved API response performance.

---

## 6. Sequential Async Bottleneck Optimization

### Issue

Independent database queries executed sequentially.

### Fix Implemented

* Optimized independent queries using `Promise.all()`

### Files Affected

* `backend/src/routes/doctors.js`

### Impact

Reduced endpoint response latency.

---

## 7. Queue Token Race Condition

### Issue

Concurrent check-ins could generate duplicate queue token numbers.

### Fix Implemented

* Added transaction-based token generation
* Implemented PostgreSQL advisory locking for concurrency-safe queue numbering

### Files Affected

* `backend/src/routes/queue.js`

### Impact

Prevents duplicate queue tokens under concurrent load.

---

## 8. Database Constraint & Index Improvements

### Issue

The schema allowed double-booking and lacked optimized query indexing.

### Fix Implemented

* Added unique constraint on:

  * `(doctorId, appointmentDate)`
* Added indexes for:

  * `(doctorId, status)`
  * `patientId`
  * `(doctorId, status, createdAt)`

### Files Affected

* `backend/prisma/schema.prisma`

### Impact

Improved data consistency and query performance.

---

## 9. React Memory Leak Fix

### Issue

Queue polling intervals continued running after component unmount.

### Fix Implemented

* Added interval cleanup in `useEffect`
* Added unmount guards to prevent stale state updates

### Files Affected

* `frontend/src/app/queue/page.js`

### Impact

Reduced memory leaks, unnecessary polling, and unstable UI behavior.

---

## 10. React Null Crash Fix

### Issue

The dashboard attempted to access methods on nullable `medicalHistory` values.

### Fix Implemented

* Added null guards and fallback handling before rendering

### Files Affected

* `frontend/src/app/dashboard/page.js`

### Impact

Prevented runtime crashes for incomplete patient records.

---

## 11. Queue Workflow Null Guard

### Issue

Doctor queue actions assumed valid doctor mappings always existed.

### Fix Implemented

* Added defensive null checking before queue actions
* Added safe fallback UI messaging

### Files Affected

* Frontend queue workflow page

### Impact

Prevented null-related queue workflow failures.

---

## 12. Missing History Records Feature

### Issue

The “View Diagnostic Reports Details (Legacy App)” route resulted in a 404 page.

### Fix Implemented

* Implemented:

  * `src/app/patients/[id]/history-records/page.js`
* Added authenticated patient data fetching
* Added loading and fallback handling

### Files Affected

* `frontend/src/app/patients/[id]/history-records/page.js`

### Impact

Completed the missing patient history workflow and resolved broken navigation.

---

# Performance Optimizations

Implemented:

* Prisma relation includes
* Query parallelization using `Promise.all`
* Additional database indexing
* Reduced unnecessary frontend polling
* Eliminated expensive loop-based database access

---

# Security Improvements

Implemented:

* Safer JWT validation
* Role-based access control
* SQL injection prevention
* Reduced credential persistence
* Removed sensitive logging
* Prevented internal error leakage

---

# Engineering Decisions

The implementation intentionally focused on:

* high-impact production issues
* minimal architectural disruption
* maintainable targeted fixes
* preserving existing UI/UX behavior

Large-scale rewrites and dependency upgrades were intentionally avoided to maintain project stability and reduce regression risk.

---

# Remaining Known Issues

The project still contains areas that could be improved further in a production environment, including:

* rate limiting
* refresh token rotation
* centralized validation middleware
* API response caching
* more granular RBAC permissions
* automated testing coverage

These were intentionally deprioritized to focus on the highest-impact engineering issues within the assignment scope.

---

# Testing Performed

Tested:

* authentication flows
* appointment booking
* queue check-ins
* doctor workflows
* patient history rendering
* role authorization
* concurrent queue generation
* frontend route navigation
* error handling paths

---

# Conclusion

The final implementation focused on improving:

* application security
* backend scalability
* frontend stability
* database integrity
* concurrency safety

while preserving the original project architecture and functionality.

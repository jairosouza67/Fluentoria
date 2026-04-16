# Access Control & Permissions

<cite>
**Referenced Files in This Document**
- [App.tsx](file://App.tsx)
- [Auth.tsx](file://components/Auth.tsx)
- [AsaasPayment.tsx](file://components/AsaasPayment.tsx)
- [check-payment-status.js](file://netlify/functions/check-payment-status.js)
- [create-asaas-customer.js](file://netlify/functions/create-asaas-customer.js)
- [process-asaas-payment.js](file://netlify/functions/process-asaas-payment.js)
- [admin.ts](file://lib/db/admin.ts)
- [asaas.ts](file://lib/db/asaas.ts)
- [userCourses.ts](file://lib/db/userCourses.ts)
- [appStore.ts](file://lib/stores/appStore.ts)
- [config.ts](file://lib/db/config.ts)
- [types.ts](file://lib/db/types.ts)
- [firebase.ts](file://lib/firebase.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)

## Introduction
This document explains the payment-based access control system used to manage user permissions, validate subscriptions, and synchronize feature availability. It covers how payment status influences access, how the frontend enforces restrictions, how backend functions validate payments against the payment provider, and how user roles and course access integrate with payment validation. It also documents security measures, fallback strategies for unpaid users, and audit trails for access control decisions.

## Project Structure
The access control system spans three layers:
- Frontend (React + Zustand store): Authenticates users, checks access, and renders restricted views.
- Backend (Netlify Functions): Validates payment status via the payment provider and enforces token-based authorization.
- Database (Firestore): Stores user roles, access flags, payment statuses, and course access records.

```mermaid
graph TB
subgraph "Frontend"
APP["App.tsx"]
AUTH["Auth.tsx"]
STORE["appStore.ts"]
PAY["AsaasPayment.tsx"]
end
subgraph "Backend Functions"
FN_CHECK["check-payment-status.js"]
FN_CREATE["create-asaas-customer.js"]
FN_PAY["process-asaas-payment.js"]
end
subgraph "Database"
FIRE["firebase.ts"]
CFG["config.ts"]
TYPES["types.ts"]
DB_ADMIN["admin.ts"]
DB_AS["asaas.ts"]
DB_UC["userCourses.ts"]
end
APP --> STORE
APP --> DB_ADMIN
APP --> DB_AS
APP --> DB_UC
PAY --> FN_CREATE
PAY --> FN_PAY
DB_AS --> FN_CHECK
FN_CHECK --> CFG
FN_CREATE --> CFG
FN_PAY --> CFG
DB_ADMIN --> FIRE
DB_AS --> FIRE
DB_UC --> FIRE
```

**Diagram sources**
- [App.tsx](file://App.tsx#L65-L108)
- [appStore.ts](file://lib/stores/appStore.ts#L48-L81)
- [AsaasPayment.tsx](file://components/AsaasPayment.tsx#L86-L181)
- [check-payment-status.js](file://netlify/functions/check-payment-status.js#L20-L151)
- [create-asaas-customer.js](file://netlify/functions/create-asaas-customer.js#L20-L145)
- [process-asaas-payment.js](file://netlify/functions/process-asaas-payment.js#L20-L120)
- [admin.ts](file://lib/db/admin.ts#L85-L127)
- [asaas.ts](file://lib/db/asaas.ts#L6-L84)
- [userCourses.ts](file://lib/db/userCourses.ts#L7-L111)
- [firebase.ts](file://lib/firebase.ts#L1-L25)
- [config.ts](file://lib/db/config.ts#L1-L19)
- [types.ts](file://lib/db/types.ts#L53-L89)

**Section sources**
- [App.tsx](file://App.tsx#L65-L108)
- [firebase.ts](file://lib/firebase.ts#L1-L25)

## Core Components
- Authentication and role loading: The application initializes on auth state changes, loads user role, and checks access authorization.
- Access enforcement: Unauthorized users (non-admins) are blocked from most screens until payment status allows access.
- Payment processing: Users can create an Asaas customer, process a payment, and persist the customer ID for future validation.
- Payment validation: A backend function queries the payment provider for confirmed payments and derives access status.
- Course access: Access can be granted/revoked based on payment or admin actions; users with active course records are treated as authorized.
- Store state: Centralized state tracks user, role, access, and payment status for UI rendering and navigation.

**Section sources**
- [App.tsx](file://App.tsx#L65-L108)
- [admin.ts](file://lib/db/admin.ts#L67-L127)
- [asaas.ts](file://lib/db/asaas.ts#L6-L84)
- [userCourses.ts](file://lib/db/userCourses.ts#L25-L99)
- [appStore.ts](file://lib/stores/appStore.ts#L5-L46)

## Architecture Overview
The system integrates Firebase Authentication, Firestore, and Netlify Functions to enforce payment-based access control.

```mermaid
sequenceDiagram
participant U as "User"
participant A as "App.tsx"
participant S as "Zustand Store"
participant DB as "Firestore (admin.ts)"
participant AS as "Asaas (asaas.ts)"
participant NF as "Netlify Functions"
U->>A : "Sign in"
A->>DB : "getUserRole(uid)"
DB-->>A : "role"
A->>DB : "checkUserAccess(uid)"
DB-->>A : "{authorized, role, paymentStatus}"
A->>S : "setHasAccess/setPaymentStatus"
alt "authorized=false"
A-->>U : "Show pending access screen"
else "authorized=true"
A-->>U : "Render requested screen"
end
U->>AS : "Create Asaas customer"
AS->>NF : "POST /.netlify/functions/create-asaas-customer"
U->>AS : "Process payment"
AS->>NF : "POST /.netlify/functions/process-asaas-payment"
U->>AS : "Check payment status"
AS->>NF : "POST /.netlify/functions/check-payment-status"
NF-->>AS : "{authorized, status}"
AS->>DB : "Update access flags/paymentStatus"
```

**Diagram sources**
- [App.tsx](file://App.tsx#L65-L108)
- [admin.ts](file://lib/db/admin.ts#L85-L127)
- [asaas.ts](file://lib/db/asaas.ts#L6-L84)
- [check-payment-status.js](file://netlify/functions/check-payment-status.js#L20-L151)
- [create-asaas-customer.js](file://netlify/functions/create-asaas-customer.js#L20-L145)
- [process-asaas-payment.js](file://netlify/functions/process-asaas-payment.js#L20-L120)

## Detailed Component Analysis

### Access Control Flow at Startup
On authentication state change, the app loads role and access, then enforces authorization before rendering protected screens.

```mermaid
sequenceDiagram
participant FB as "Firebase Auth"
participant APP as "App.tsx"
participant DB as "admin.ts"
participant STORE as "appStore.ts"
FB-->>APP : "onAuthStateChanged(user)"
APP->>DB : "getUserRole(uid)"
DB-->>APP : "role"
APP->>DB : "checkUserAccess(uid)"
DB-->>APP : "{authorized, role, paymentStatus}"
APP->>STORE : "setHasAccess/ setPaymentStatus"
alt "authorized=false and role!=admin"
APP-->>FB : "Block rendering and show pending screen"
else "authorized=true"
APP-->>FB : "Render dashboard/screen"
end
```

**Diagram sources**
- [App.tsx](file://App.tsx#L65-L108)
- [admin.ts](file://lib/db/admin.ts#L67-L127)
- [appStore.ts](file://lib/stores/appStore.ts#L51-L56)

**Section sources**
- [App.tsx](file://App.tsx#L65-L108)
- [admin.ts](file://lib/db/admin.ts#L85-L127)
- [appStore.ts](file://lib/stores/appStore.ts#L51-L56)

### Payment Status Validation via Netlify Functions
Payments are validated by querying the payment provider through a secured function that verifies Firebase ID tokens and returns derived access status.

```mermaid
sequenceDiagram
participant FE as "AsaasPayment.tsx"
participant FN as "check-payment-status.js"
participant AP as "Asaas API"
participant DB as "Firestore"
FE->>FN : "POST {customerId} with Bearer token"
FN->>FN : "jwtVerify(Firebase)"
FN->>AP : "GET payments?customer=status=CONFIRMED"
AP-->>FN : "payments[]"
FN->>FN : "Compute authorized/status"
FN-->>FE : "{authorized, status, payments}"
FE->>DB : "Update access flags (syncAllStudents)"
```

**Diagram sources**
- [AsaasPayment.tsx](file://components/AsaasPayment.tsx#L130-L181)
- [check-payment-status.js](file://netlify/functions/check-payment-status.js#L20-L151)
- [asaas.ts](file://lib/db/asaas.ts#L6-L37)

**Section sources**
- [check-payment-status.js](file://netlify/functions/check-payment-status.js#L20-L151)
- [asaas.ts](file://lib/db/asaas.ts#L6-L37)

### Role-Based Access and Course-Level Permissions
Access can be granted at two levels:
- Payment-driven: Active payments or active course records authorize access.
- Admin-managed: Explicit flags and course grants override or complement payment status.

```mermaid
flowchart TD
Start(["checkUserAccess(uid)"]) --> Load["Load user doc"]
Load --> IsAdmin{"role == admin?"}
IsAdmin --> |Yes| Allow["authorized=true"]
IsAdmin --> |No| CheckFlag{"accessAuthorized == true?"}
CheckFlag --> |Yes| Allow
CheckFlag --> |No| CheckCourses["Query user_courses for active"]
CheckCourses --> HasCourse{"Any active?"}
HasCourse --> |Yes| Allow
HasCourse --> |No| Deny["authorized=false"]
Allow --> SetStatus["Set paymentStatus from doc"]
Deny --> SetStatus
SetStatus --> End(["Return {authorized, role, paymentStatus}"])
```

**Diagram sources**
- [admin.ts](file://lib/db/admin.ts#L85-L127)
- [userCourses.ts](file://lib/db/userCourses.ts#L89-L99)

**Section sources**
- [admin.ts](file://lib/db/admin.ts#L85-L127)
- [userCourses.ts](file://lib/db/userCourses.ts#L89-L99)

### Payment Provider Integration Details
- Customer creation: Frontend posts to a function that validates the token and calls the provider to create a customer record.
- Payment processing: Frontend posts to a function that proxies the request to the provider.
- Status check: Frontend posts to a function that validates the token and queries the provider for confirmed payments, returning a derived status.

```mermaid
sequenceDiagram
participant FE as "AsaasPayment.tsx"
participant FC as "create-asaas-customer.js"
participant FP as "process-asaas-payment.js"
participant AP as "Asaas API"
FE->>FC : "POST customer data (Bearer)"
FC->>AP : "Create customer"
AP-->>FC : "customerId"
FC-->>FE : "{customerId}"
FE->>FP : "POST payment data (Bearer)"
FP->>AP : "Create payment"
AP-->>FP : "payment"
FP-->>FE : "payment"
```

**Diagram sources**
- [AsaasPayment.tsx](file://components/AsaasPayment.tsx#L86-L181)
- [create-asaas-customer.js](file://netlify/functions/create-asaas-customer.js#L20-L145)
- [process-asaas-payment.js](file://netlify/functions/process-asaas-payment.js#L20-L120)

**Section sources**
- [AsaasPayment.tsx](file://components/AsaasPayment.tsx#L86-L181)
- [create-asaas-customer.js](file://netlify/functions/create-asaas-customer.js#L20-L145)
- [process-asaas-payment.js](file://netlify/functions/process-asaas-payment.js#L20-L120)

### Data Model for Access Control
The system relies on Firestore collections and fields to track access and payment status.

```mermaid
erDiagram
USERS {
string uid PK
string email
string role
boolean accessAuthorized
string paymentStatus
string planStatus
string asaasCustomerId
date lastAsaasSync
boolean manualAuthorization
}
USER_COURSES {
string id PK
string userId FK
string courseId
enum status
enum source
date purchaseDate
string asaasPaymentId
}
USERS ||--o{ USER_COURSES : "has"
```

**Diagram sources**
- [config.ts](file://lib/db/config.ts#L11-L19)
- [types.ts](file://lib/db/types.ts#L53-L89)

**Section sources**
- [config.ts](file://lib/db/config.ts#L11-L19)
- [types.ts](file://lib/db/types.ts#L53-L89)

## Dependency Analysis
- Frontend depends on Firebase Auth and Firestore for identity and access state.
- Netlify Functions depend on Firebase ID token verification and the payment provider API.
- Firestore collections define the canonical state for access control and course permissions.

```mermaid
graph LR
AUTH["Auth.tsx"] --> APP["App.tsx"]
APP --> STORE["appStore.ts"]
APP --> DB_ADMIN["admin.ts"]
APP --> DB_AS["asaas.ts"]
APP --> DB_UC["userCourses.ts"]
PAY["AsaasPayment.tsx"] --> FN1["create-asaas-customer.js"]
PAY --> FN2["process-asaas-payment.js"]
DB_AS --> FN3["check-payment-status.js"]
FN1 --> CFG["config.ts"]
FN2 --> CFG
FN3 --> CFG
DB_ADMIN --> FIRE["firebase.ts"]
DB_AS --> FIRE
DB_UC --> FIRE
```

**Diagram sources**
- [Auth.tsx](file://components/Auth.tsx#L1-L265)
- [App.tsx](file://App.tsx#L65-L108)
- [appStore.ts](file://lib/stores/appStore.ts#L48-L81)
- [admin.ts](file://lib/db/admin.ts#L24-L64)
- [asaas.ts](file://lib/db/asaas.ts#L39-L84)
- [userCourses.ts](file://lib/db/userCourses.ts#L7-L23)
- [AsaasPayment.tsx](file://components/AsaasPayment.tsx#L86-L181)
- [create-asaas-customer.js](file://netlify/functions/create-asaas-customer.js#L20-L145)
- [process-asaas-payment.js](file://netlify/functions/process-asaas-payment.js#L20-L120)
- [check-payment-status.js](file://netlify/functions/check-payment-status.js#L20-L151)
- [firebase.ts](file://lib/firebase.ts#L1-L25)
- [config.ts](file://lib/db/config.ts#L1-L19)

**Section sources**
- [App.tsx](file://App.tsx#L65-L108)
- [admin.ts](file://lib/db/admin.ts#L24-L64)
- [asaas.ts](file://lib/db/asaas.ts#L39-L84)
- [userCourses.ts](file://lib/db/userCourses.ts#L7-L23)
- [firebase.ts](file://lib/firebase.ts#L1-L25)

## Performance Considerations
- Minimize repeated access checks: The app caches role and access status per session to avoid redundant Firestore reads.
- Debounce payment status refreshes: Avoid frequent polling of the payment provider; rely on scheduled sync for batch updates.
- Efficient course access queries: Use indexed fields (userId, courseId, status) to keep course access checks fast.
- Token verification caching: Reuse verified claims where appropriate to reduce function cold starts.

## Troubleshooting Guide
Common issues and remedies:
- Unauthorized access screen appears after login:
  - Verify the user’s access flags and payment status in Firestore.
  - Trigger a manual sync to update access flags based on payment status.
- Payment processing fails:
  - Confirm the function receives a valid Firebase ID token.
  - Check provider API responses for errors and ensure required fields are present.
- Admin privileges not applied:
  - Ensure the user’s email matches configured admin lists and that the role is set accordingly.
- Course access not granted:
  - Confirm the user-course record exists with active status and correct source.

Operational checks:
- Validate token verification in functions.
- Inspect Firestore documents for access flags and payment status.
- Review function logs for provider API errors.

**Section sources**
- [check-payment-status.js](file://netlify/functions/check-payment-status.js#L43-L62)
- [admin.ts](file://lib/db/admin.ts#L129-L165)
- [asaas.ts](file://lib/db/asaas.ts#L87-L144)

## Conclusion
The payment-based access control system combines Firebase Authentication, Firestore state, and Netlify Functions to securely enforce access based on payment status and course ownership. Administrators can override access flags, while automated sync keeps user states aligned with the payment provider. The frontend enforces runtime access checks, and the store centralizes state for consistent UI behavior. Robust token verification and structured data models underpin security and reliability.
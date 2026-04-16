# Check Payment Status Function

<cite>
**Referenced Files in This Document**
- [check-payment-status.js](file://netlify/functions/check-payment-status.js)
- [process-asaas-payment.js](file://netlify/functions/process-asaas-payment.js)
- [create-asaas-customer.js](file://netlify/functions/create-asaas-customer.js)
- [AsaasPayment.tsx](file://components/AsaasPayment.tsx)
- [asaas.ts](file://lib/db/asaas.ts)
- [index.js](file://functions/src/index.js)
- [updateUserCustomerId.js](file://functions/src/api/updateUserCustomerId.js)
- [netlify.toml](file://netlify.toml)
- [firebase.ts](file://lib/firebase.ts)
- [test-asass-webhook.js](file://test-asass-webhook.js)
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
10. [Appendices](#appendices)

## Introduction
This document explains the check-payment-status Netlify function and its role in the payment lifecycle. It covers how the function verifies payment status, integrates with Asaas webhooks, updates user access control, synchronizes data, handles errors, and supports retries. It also documents webhook processing, status update scenarios, and frontend integration with the payment component.

## Project Structure
The payment system spans frontend components, Netlify functions, and Firebase Cloud Functions:
- Frontend payment UI triggers creation of Asaas customers and payments.
- Netlify functions handle secure customer creation, payment processing, and payment status checks.
- Firebase Cloud Functions process Asaas webhooks to update user access and course enrollments.
- A shared library synchronizes payment status and updates Firestore records.

```mermaid
graph TB
subgraph "Frontend"
UI["AsaasPayment.tsx"]
FB["firebase.ts"]
end
subgraph "Netlify Functions"
N1["create-asaas-customer.js"]
N2["process-asaas-payment.js"]
N3["check-payment-status.js"]
end
subgraph "Firebase Cloud Functions"
F1["functions/src/index.js<br/>asaasWebhook"]
F2["functions/src/api/updateUserCustomerId.js"]
end
subgraph "External Services"
ASAAS["Asaas API"]
FIRESTORE["Firestore"]
end
UI --> FB
UI --> N1
UI --> N2
UI --> N3
N1 --> ASAAS
N2 --> ASAAS
N3 --> ASAAS
ASAAS --> F1
F1 --> FIRESTORE
UI --> F2
```

**Diagram sources**
- [AsaasPayment.tsx](file://components/AsaasPayment.tsx#L86-L181)
- [create-asaas-customer.js](file://netlify/functions/create-asaas-customer.js#L88-L132)
- [process-asaas-payment.js](file://netlify/functions/process-asaas-payment.js#L79-L107)
- [check-payment-status.js](file://netlify/functions/check-payment-status.js#L88-L138)
- [index.js](file://functions/src/index.js#L144-L339)
- [updateUserCustomerId.js](file://functions/src/api/updateUserCustomerId.js#L12-L73)

**Section sources**
- [AsaasPayment.tsx](file://components/AsaasPayment.tsx#L86-L181)
- [check-payment-status.js](file://netlify/functions/check-payment-status.js#L20-L151)
- [index.js](file://functions/src/index.js#L144-L339)

## Core Components
- check-payment-status function: Validates JWT, authenticates via Google JWKs, queries Asaas for CONFIRMED payments filtered by customer ID, determines active/overdue/no_payment, and returns authorized flag and status.
- AsaasPayment component: Collects customer/payment info, creates Asaas customer via Netlify function, stores customer ID, creates payment via Netlify function, and transitions UI states.
- Asaas webhook handler: Verifies webhook signature, processes payment confirmation and overdue events, updates user access and course enrollment, and sets planStatus accordingly.
- Shared sync library: Calls check-payment-status to synchronize student access and planStatus in Firestore.

**Section sources**
- [check-payment-status.js](file://netlify/functions/check-payment-status.js#L6-L18)
- [AsaasPayment.tsx](file://components/AsaasPayment.tsx#L86-L181)
- [index.js](file://functions/src/index.js#L144-L339)
- [asaas.ts](file://lib/db/asaas.ts#L7-L37)

## Architecture Overview
The system uses a hybrid architecture:
- Frontend interacts with Netlify functions for customer and payment operations.
- Netlify functions call Asaas APIs and return structured responses.
- Asaas sends signed webhooks to Firebase Cloud Functions.
- Firebase Cloud Functions update Firestore and course mappings.

```mermaid
sequenceDiagram
participant Client as "Client App"
participant UI as "AsaasPayment.tsx"
participant NL as "Netlify Functions"
participant ASAAS as "Asaas API"
participant FB as "Firebase Cloud Functions"
participant FS as "Firestore"
Client->>UI : "Submit payment form"
UI->>NL : "POST create-asaas-customer"
NL->>ASAAS : "Create customer"
ASAAS-->>NL : "Customer ID"
NL-->>UI : "customerId"
UI->>FB : "Update user document with customerId"
UI->>NL : "POST process-asaas-payment"
NL->>ASAAS : "Create payment"
ASAAS-->>NL : "Payment details"
NL-->>UI : "Payment result"
UI->>NL : "POST check-payment-status"
NL->>ASAAS : "Fetch CONFIRMED payments"
ASAAS-->>NL : "Payments list"
NL-->>UI : "{authorized, status}"
ASAAS-->>FB : "Webhook (PAYMENT_RECEIVED/PAYMENT_OVERDUE)"
FB->>FS : "Update user access and course enrollments"
```

**Diagram sources**
- [AsaasPayment.tsx](file://components/AsaasPayment.tsx#L86-L244)
- [create-asaas-customer.js](file://netlify/functions/create-asaas-customer.js#L88-L132)
- [process-asaas-payment.js](file://netlify/functions/process-asaas-payment.js#L79-L107)
- [check-payment-status.js](file://netlify/functions/check-payment-status.js#L88-L138)
- [index.js](file://functions/src/index.js#L144-L339)

## Detailed Component Analysis

### check-payment-status Function
Responsibilities:
- Authentication: Extracts Authorization header, verifies Firebase ID token against Google JWKS, rejects invalid tokens.
- Input validation: Requires customerId in request body.
- Asaas integration: Queries Asaas payments for a given customer with CONFIRMED status.
- Decision logic: Determines active if any CONFIRMED payment’s due date is today or in the future; overdue otherwise; no_payment if none.
- Response: Returns authorized flag, status, and payments array.

```mermaid
flowchart TD
Start(["Function Entry"]) --> Preflight{"HTTP Method == OPTIONS?"}
Preflight --> |Yes| Return204["Return 204 No Content"]
Preflight --> |No| MethodCheck{"HTTP Method == POST?"}
MethodCheck --> |No| Return405["Return 405 Method Not Allowed"]
MethodCheck --> |Yes| Auth["Extract Authorization header"]
Auth --> HasToken{"Has Bearer token?"}
HasToken --> |No| Return401a["Return 401 Unauthorized"]
HasToken --> |Yes| Verify["Verify Firebase ID token via JWKS"]
Verify --> Verified{"Token valid?"}
Verified --> |No| Return401b["Return 401 Unauthorized"]
Verified --> |Yes| ParseBody["Parse customerId from body"]
ParseBody --> Validate{"customerId present?"}
Validate --> |No| Return400["Return 400 Missing customerId"]
Validate --> |Yes| FetchPayments["GET /payments?customer={id}&status=CONFIRMED"]
FetchPayments --> RespOK{"Response OK?"}
RespOK --> |No| ReturnAsaasErr["Return Asaas error details"]
RespOK --> |Yes| Payments["Parse payments array"]
Payments --> ActiveCheck["Any CONFIRMED and dueDate >= now?"]
ActiveCheck --> |Yes| SetActive["status='active', authorized=true"]
ActiveCheck --> |No| AnyPayments{"Any payments?"}
AnyPayments --> |Yes| SetOverdue["status='overdue', authorized=false"]
AnyPayments --> |No| SetNoPay["status='no_payment', authorized=false"]
SetActive --> Return200["Return {authorized,status,payments}"]
SetOverdue --> Return200
SetNoPay --> Return200
Return204 --> End(["Exit"])
Return405 --> End
Return401a --> End
Return401b --> End
Return400 --> End
ReturnAsaasErr --> End
Return200 --> End
```

**Diagram sources**
- [check-payment-status.js](file://netlify/functions/check-payment-status.js#L20-L151)

**Section sources**
- [check-payment-status.js](file://netlify/functions/check-payment-status.js#L20-L151)

### AsaasPayment Component Integration
Behavior:
- Validates form inputs and formats card details.
- Creates Asaas customer via Netlify function and stores returned customerId.
- Updates user document with customerId using Firebase Cloud Function endpoint.
- Submits payment creation request to Netlify function.
- On success, transitions to success state; on failure, transitions to error state.

```mermaid
sequenceDiagram
participant UI as "AsaasPayment.tsx"
participant NL1 as "create-asaas-customer.js"
participant NL2 as "process-asaas-payment.js"
participant ASAAS as "Asaas API"
participant FB as "updateUserCustomerId.js"
UI->>NL1 : "POST customer data"
NL1->>ASAAS : "Create customer"
ASAAS-->>NL1 : "customerId"
NL1-->>UI : "customerId"
UI->>FB : "POST {userId,customerId}"
FB-->>UI : "OK"
UI->>NL2 : "POST payment data"
NL2->>ASAAS : "Create payment"
ASAAS-->>NL2 : "Payment"
NL2-->>UI : "Payment"
UI->>UI : "Transition to success/error"
```

**Diagram sources**
- [AsaasPayment.tsx](file://components/AsaasPayment.tsx#L86-L244)
- [create-asaas-customer.js](file://netlify/functions/create-asaas-customer.js#L88-L132)
- [process-asaas-payment.js](file://netlify/functions/process-asaas-payment.js#L79-L107)
- [updateUserCustomerId.js](file://functions/src/api/updateUserCustomerId.js#L12-L73)

**Section sources**
- [AsaasPayment.tsx](file://components/AsaasPayment.tsx#L86-L244)

### Asaas Webhook Processing
Behavior:
- Validates webhook signature using a shared secret token.
- Handles PAYMENT_RECEIVED/PAYMENT_CONFIRMED: finds user by email, ensures accessAuthorized, sets paymentStatus and planStatus to active, and maps course enrollment via externalReference.
- Handles PAYMENT_OVERDUE: deactivates course enrollment and, if no active courses remain, deactivates global access.

```mermaid
sequenceDiagram
participant ASAAS as "Asaas"
participant FB as "asaasWebhook (index.js)"
participant FS as "Firestore"
ASAAS->>FB : "POST webhook (signature + payload)"
FB->>FB : "Verify webhook token"
FB->>FS : "Lookup user by email"
alt PAYMENT_RECEIVED/CONFIRMED
FB->>FS : "Set accessAuthorized=true, paymentStatus='active', planStatus='active'"
FB->>FS : "Map user_courses by courseId from externalReference"
else PAYMENT_OVERDUE
FB->>FS : "Set course status='overdue'"
FB->>FS : "If no active courses : set accessAuthorized=false, planStatus='pending'"
end
FB-->>ASAAS : "200 OK"
```

**Diagram sources**
- [index.js](file://functions/src/index.js#L144-L339)

**Section sources**
- [index.js](file://functions/src/index.js#L144-L339)

### Data Synchronization and Access Control Updates
Mechanism:
- The shared library calls the check-payment-status function to determine authorized and status.
- It updates Firestore fields: accessAuthorized, paymentStatus, planStatus, and lastAsaasSync for each student.
- Manual authorizations are respected and skipped during automated sync.

```mermaid
flowchart TD
SyncStart["Start syncAllStudentsWithAsaas"] --> Query["Query students"]
Query --> Loop{"For each student"}
Loop --> Manual{"manualAuthorization?"}
Manual --> |Yes| Next["Skip"]
Manual --> |No| HasCID{"Has asaasCustomerId?"}
HasCID --> |No| Err["Record error: no customer ID"] --> Next
HasCID --> |Yes| CallCheck["Call check-payment-status"]
CallCheck --> Update["Update accessAuthorized, paymentStatus, planStatus, lastAsaasSync"]
Update --> Next
Next --> Loop
Loop --> |Done| SyncEnd["Finish"]
```

**Diagram sources**
- [asaas.ts](file://lib/db/asaas.ts#L87-L144)
- [check-payment-status.js](file://netlify/functions/check-payment-status.js#L88-L138)

**Section sources**
- [asaas.ts](file://lib/db/asaas.ts#L87-L144)

## Dependency Analysis
Key dependencies and relationships:
- Frontend depends on Netlify functions for customer and payment operations and on Firebase Cloud Functions for updating user customer IDs.
- Netlify functions depend on Asaas APIs and environment variables for credentials.
- Firebase Cloud Functions depend on Firestore and process Asaas webhooks.
- The shared library depends on the check-payment-status function and Firestore.

```mermaid
graph LR
UI["AsaasPayment.tsx"] --> N1["create-asaas-customer.js"]
UI --> N2["process-asaas-payment.js"]
UI --> N3["check-payment-status.js"]
N1 --> ASAAS["Asaas API"]
N2 --> ASAAS
N3 --> ASAAS
ASAAS --> F1["asaasWebhook (index.js)"]
F1 --> FS["Firestore"]
UI --> F2["updateUserCustomerId.js"]
```

**Diagram sources**
- [AsaasPayment.tsx](file://components/AsaasPayment.tsx#L86-L244)
- [create-asaas-customer.js](file://netlify/functions/create-asaas-customer.js#L88-L132)
- [process-asaas-payment.js](file://netlify/functions/process-asaas-payment.js#L79-L107)
- [check-payment-status.js](file://netlify/functions/check-payment-status.js#L88-L138)
- [index.js](file://functions/src/index.js#L144-L339)
- [updateUserCustomerId.js](file://functions/src/api/updateUserCustomerId.js#L12-L73)

**Section sources**
- [AsaasPayment.tsx](file://components/AsaasPayment.tsx#L86-L244)
- [check-payment-status.js](file://netlify/functions/check-payment-status.js#L88-L138)
- [index.js](file://functions/src/index.js#L144-L339)

## Performance Considerations
- Minimize external API calls: batch operations where possible and avoid redundant checks.
- Use caching: cache customer IDs and recent payment statuses to reduce repeated network calls.
- Optimize filters: query Asaas with precise filters (e.g., CONFIRMED and dueDate) to limit payload sizes.
- Asynchronous processing: offload heavy tasks to background jobs to keep response times low.
- Monitor latency: track function execution duration and external API response times.

## Troubleshooting Guide
Common issues and resolutions:
- Missing or invalid Authorization header: Ensure the frontend passes a valid Firebase ID token in the Authorization header.
- Asaas API errors: Inspect returned error details and Asaas error arrays; verify ASAAS_ACCESS_TOKEN and ASAAS_API_URL environment variables.
- Webhook signature mismatch: Confirm the webhook token matches the configured secret and is sent in the correct header.
- Customer ID not stored: Verify the update user customer ID endpoint succeeds and that the user document is updated.
- Overdue access not revoked: Check course enrollment mappings and manual authorization flags.

Monitoring and debugging:
- Enable logging in functions for request and error traces.
- Use Netlify and Firebase logs to correlate request IDs and timestamps.
- Validate environment variables in deployment settings.
- Simulate webhook events locally using the provided test script.

**Section sources**
- [check-payment-status.js](file://netlify/functions/check-payment-status.js#L140-L150)
- [index.js](file://functions/src/index.js#L160-L179)
- [test-asass-webhook.js](file://test-asass-webhook.js#L42-L67)

## Conclusion
The check-payment-status function is central to validating payment eligibility and enabling real-time access control updates. Combined with the Asaas webhook handler and frontend integration, it provides a robust payment lifecycle that keeps user access synchronized with Asaas payment states. Proper error handling, logging, and environment configuration are essential for reliable operation.

## Appendices

### Environment Variables and Headers
- Required environment variables:
  - ASAAS_ACCESS_TOKEN: Asaas API access token.
  - ASAAS_API_URL: Asaas API base URL (defaults to sandbox).
  - FIREBASE_PROJECT_ID: Used for JWT verification.
  - functions.config().asaas.webhook_token: Shared secret for webhook signature verification.
- Headers:
  - Authorization: Bearer <Firebase ID Token>.
  - Content-Type: application/json.
  - access_token: Asaas access token for Asaas API calls.
  - X-Asaas-Access-Token: Webhook signature header.

**Section sources**
- [check-payment-status.js](file://netlify/functions/check-payment-status.js#L76-L86)
- [index.js](file://functions/src/index.js#L162-L179)
- [netlify.toml](file://netlify.toml#L39-L47)
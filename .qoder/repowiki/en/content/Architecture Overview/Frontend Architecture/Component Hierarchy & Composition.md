# Component Hierarchy & Composition

<cite>
**Referenced Files in This Document**
- [App.tsx](file://App.tsx)
- [index.tsx](file://index.tsx)
- [Sidebar.tsx](file://components/Sidebar.tsx)
- [MobileNav.tsx](file://components/MobileNav.tsx)
- [Auth.tsx](file://components/Auth.tsx)
- [ErrorBoundary.tsx](file://components/ErrorBoundary.tsx)
- [StudentDashboard.tsx](file://components/StudentDashboard.tsx)
- [AdminCatalog.tsx](file://components/AdminCatalog.tsx)
- [types.ts](file://types.ts)
- [appStore.ts](file://lib/stores/appStore.ts)
- [courseStore.ts](file://lib/stores/courseStore.ts)
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
This document explains the component hierarchy and composition patterns of the Fluentoria React application. It focuses on the root App.tsx as the central orchestrator for authentication state, screen routing, and user role management. It documents the sidebar and mobile navigation systems, authentication wrapper behavior, conditional rendering for student vs admin views, screen-based routing with lazy loading, and lifecycle management. It also covers the relationship between parent and child components, prop passing patterns, error boundaries, and suspense loading states.

## Project Structure
The application bootstraps at the root index.tsx and renders the App component. App.tsx manages global state, authentication, role checks, and routes to screen-specific components. UI navigation is handled by Sidebar (desktop) and MobileNav (mobile). Authentication is encapsulated in Auth.tsx, while error handling and loading states are provided by ErrorBoundary and Suspense around lazily loaded screens.

```mermaid
graph TB
Root["index.tsx<br/>ReactDOM.createRoot"] --> App["App.tsx<br/>Root orchestrator"]
App --> Sidebar["components/Sidebar.tsx<br/>Desktop nav"]
App --> MobileNav["components/MobileNav.tsx<br/>Mobile nav"]
App --> Auth["components/Auth.tsx<br/>Auth wrapper"]
App --> ErrorBoundary["components/ErrorBoundary.tsx<br/>Error boundary"]
App --> Suspense["React.Suspense<br/>Lazy fallback"]
Suspense --> Screens["Lazy-loaded screens<br/>StudentDashboard, AdminCatalog, etc."]
```

**Diagram sources**
- [index.tsx](file://index.tsx#L12-L17)
- [App.tsx](file://App.tsx#L40-L447)
- [Sidebar.tsx](file://components/Sidebar.tsx#L27-L124)
- [MobileNav.tsx](file://components/MobileNav.tsx#L11-L94)
- [Auth.tsx](file://components/Auth.tsx#L12-L265)
- [ErrorBoundary.tsx](file://components/ErrorBoundary.tsx#L13-L82)

**Section sources**
- [index.tsx](file://index.tsx#L1-L65)
- [App.tsx](file://App.tsx#L1-L449)

## Core Components
- App.tsx: Central orchestrator managing authentication state, user role, access checks, screen routing, and view mode toggling. Integrates Sidebar, MobileNav, Auth, ErrorBoundary, and Suspense.
- Sidebar.tsx: Desktop navigation drawer with role-aware items and logout action.
- MobileNav.tsx: Bottom mobile navigation bar with role-aware items and logout action.
- Auth.tsx: Authentication wrapper handling login/signup and Google OAuth flows.
- ErrorBoundary.tsx: Error boundary catching rendering errors and offering retry/reload actions.
- Lazy-loaded screens: StudentDashboard and AdminCatalog (and others) rendered conditionally based on view mode and current screen.

Key state and types:
- Types define Screen union and ViewMode, enabling strict routing and view-mode control.
- Zustand stores manage global state (appStore) and course selection (courseStore).

**Section sources**
- [App.tsx](file://App.tsx#L40-L447)
- [Sidebar.tsx](file://components/Sidebar.tsx#L27-L124)
- [MobileNav.tsx](file://components/MobileNav.tsx#L11-L94)
- [Auth.tsx](file://components/Auth.tsx#L12-L265)
- [ErrorBoundary.tsx](file://components/ErrorBoundary.tsx#L13-L82)
- [types.ts](file://types.ts#L1-L125)
- [appStore.ts](file://lib/stores/appStore.ts#L1-L82)
- [courseStore.ts](file://lib/stores/courseStore.ts#L1-L27)

## Architecture Overview
The App component coordinates three major subsystems:
- Authentication and Role Management: Listens to Firebase auth state, loads user role and access, and sets initial screen.
- Navigation and Routing: Uses a Screen union type and a renderScreen() switch to select the appropriate lazy-loaded component.
- Presentation and UX: Wraps content with ErrorBoundary and Suspense for robust error handling and smooth loading.

```mermaid
graph TB
subgraph "Auth & Role"
A1["Firebase onAuthStateChanged"] --> A2["getUserRole()"]
A2 --> A3["checkUserAccess()"]
A3 --> A4["useAppStore state"]
end
subgraph "Routing"
R1["currentScreen (Screen)"] --> R2["renderScreen() switch"]
R2 --> R3["React.lazy screens"]
end
subgraph "UI"
U1["Sidebar (desktop)"] --> U3["navigateTo()"]
U2["MobileNav (mobile)"] --> U3
U3["useAppStore.navigateTo"] --> R1
U4["Profile Menu"] --> U5["handleLogout()"]
end
A4 --> R1
R3 --> E1["ErrorBoundary"]
E1 --> S1["React.Suspense fallback"]
```

**Diagram sources**
- [App.tsx](file://App.tsx#L65-L108)
- [App.tsx](file://App.tsx#L240-L324)
- [Sidebar.tsx](file://components/Sidebar.tsx#L27-L124)
- [MobileNav.tsx](file://components/MobileNav.tsx#L11-L94)
- [ErrorBoundary.tsx](file://components/ErrorBoundary.tsx#L13-L82)

## Detailed Component Analysis

### App.tsx: Root Orchestrator
Responsibilities:
- Authentication lifecycle: Subscribes to onAuthStateChanged, loads role and access, normalizes admin emails, and redirects to dashboard after login.
- Access gating: Blocks unauthorized users (except admin) with a dedicated pending-access UI.
- View mode switching: Toggles between student and admin modes; admin gets a floating toggle button.
- Screen routing: renderScreen() selects the active screen based on viewMode and currentScreen.
- Lazy loading: All screens are imported lazily; Suspense provides a spinner fallback.
- Error handling: ErrorBoundary wraps the main content area.

Prop drilling pattern:
- App passes down onNavigate (navigateTo), viewMode, currentScreen, and onLogout to Sidebar and MobileNav.
- Selected course/gallery/module are passed to screens via props (e.g., CourseList -> GalleryList -> ModuleSelection -> CourseDetail).

Lifecycle management:
- useEffect subscriptions for auth state and click-outside detection.
- Cleanup of listeners on unmount.
- PWA shortcut handling to pre-select a screen on first visit.

```mermaid
sequenceDiagram
participant FB as "Firebase Auth"
participant App as "App.tsx"
participant Store as "useAppStore"
participant Nav as "Sidebar/MobileNav"
FB->>App : "onAuthStateChanged(user)"
App->>App : "Load role and access"
App->>Store : "Set user, userRole, access flags"
App->>Store : "setCurrentScreen('dashboard' if auth)"
App->>Nav : "Pass onNavigate/viewMode/currentScreen"
Nav-->>App : "navigateTo(screen)"
App->>Store : "setCurrentScreen(screen)"
```

**Diagram sources**
- [App.tsx](file://App.tsx#L65-L108)
- [App.tsx](file://App.tsx#L341-L347)
- [Sidebar.tsx](file://components/Sidebar.tsx#L27-L124)
- [MobileNav.tsx](file://components/MobileNav.tsx#L11-L94)

**Section sources**
- [App.tsx](file://App.tsx#L40-L447)
- [appStore.ts](file://lib/stores/appStore.ts#L48-L81)

### Sidebar.tsx and MobileNav.tsx: Navigation Systems
- Both components receive viewMode, currentScreen, onNavigate, and onLogout.
- Sidebar is desktop-only; MobileNav adapts to mobile with a bottom bar.
- Conditional rendering for admin vs student items; active state determined by currentScreen.

```mermaid
classDiagram
class Sidebar {
+props : viewMode, currentScreen, onNavigate(), onLogout(), user?
+render()
}
class MobileNav {
+props : currentScreen, onNavigate(), viewMode
+render()
}
Sidebar --> "calls" onNavigate : "navigation"
Sidebar --> "calls" onLogout : "logout"
MobileNav --> "calls" onNavigate : "navigation"
```

**Diagram sources**
- [Sidebar.tsx](file://components/Sidebar.tsx#L19-L25)
- [MobileNav.tsx](file://components/MobileNav.tsx#L5-L9)

**Section sources**
- [Sidebar.tsx](file://components/Sidebar.tsx#L27-L124)
- [MobileNav.tsx](file://components/MobileNav.tsx#L11-L94)

### Auth.tsx: Authentication Wrapper
- Handles email/password and Google OAuth flows.
- On successful auth, invokes onLogin() to signal App.tsx to proceed.
- Provides form validation feedback and error messaging.

```mermaid
sequenceDiagram
participant UI as "Auth.tsx"
participant FB as "Firebase Auth"
participant DB as "Firestore (createOrUpdateUser)"
participant App as "App.tsx"
UI->>FB : "signInWithEmailAndPassword / createUserWithEmailAndPassword"
FB-->>UI : "User credential"
UI->>DB : "createOrUpdateUser()"
DB-->>UI : "OK"
UI-->>App : "onLogin()"
App->>App : "Unsubscribe auth listener, set user, redirect"
```

**Diagram sources**
- [Auth.tsx](file://components/Auth.tsx#L21-L60)
- [Auth.tsx](file://components/Auth.tsx#L62-L92)
- [App.tsx](file://App.tsx#L65-L108)

**Section sources**
- [Auth.tsx](file://components/Auth.tsx#L12-L265)
- [App.tsx](file://App.tsx#L151-L173)

### ErrorBoundary.tsx and Suspense: Robust Rendering
- ErrorBoundary catches rendering errors and offers retry/reload actions.
- Suspense wraps lazy-loaded screens with a spinner fallback.

```mermaid
flowchart TD
Start(["Render App"]) --> Try["Render children inside ErrorBoundary"]
Try --> |No error| Done["Success"]
Try --> |Error| EB["ErrorBoundary handles"]
EB --> Retry["User clicks retry or reload"]
Retry --> Done
```

**Diagram sources**
- [ErrorBoundary.tsx](file://components/ErrorBoundary.tsx#L13-L82)
- [App.tsx](file://App.tsx#L421-L425)

**Section sources**
- [ErrorBoundary.tsx](file://components/ErrorBoundary.tsx#L13-L82)
- [App.tsx](file://App.tsx#L34-L38)
- [App.tsx](file://App.tsx#L421-L425)

### Conditional Rendering: Student vs Admin
- ViewMode drives two distinct navigation trees and screen sets.
- Admin viewMode enables admin screens and a floating toggle button.
- Access checks gate non-admin unauthorized users with a pending-access page.

```mermaid
flowchart TD
Mode["viewMode"] --> IsAdmin{"admin?"}
IsAdmin --> |Yes| AdminScreens["Admin screens<br/>AdminCatalog, Students, Reports, Settings, FinancialReports"]
IsAdmin --> |No| StudentScreens["Student screens<br/>Dashboard, Courses, Gallery, Modules, Details, Mindful, Music, Profile, Achievements, Leaderboard, Attendance"]
Access["accessChecked && !hasAccess && userRole !== 'admin'"] --> Pending["Pending access UI"]
```

**Diagram sources**
- [App.tsx](file://App.tsx#L240-L324)
- [App.tsx](file://App.tsx#L175-L238)

**Section sources**
- [App.tsx](file://App.tsx#L240-L324)
- [App.tsx](file://App.tsx#L175-L238)

### Screen-Based Routing with Lazy Loading
- All screen components are imported lazily.
- Suspense provides a consistent loading spinner while chunks download.
- renderScreen() maps currentScreen to the appropriate lazy component.

```mermaid
sequenceDiagram
participant App as "App.tsx"
participant Suspense as "React.Suspense"
participant Screen as "Lazy Screen"
App->>Suspense : "Wrap renderScreen()"
Suspense->>Screen : "Import on demand"
Screen-->>Suspense : "Loaded component"
Suspense-->>App : "Render screen"
```

**Diagram sources**
- [App.tsx](file://App.tsx#L6-L22)
- [App.tsx](file://App.tsx#L421-L425)

**Section sources**
- [App.tsx](file://App.tsx#L6-L22)
- [App.tsx](file://App.tsx#L421-L425)

### Component Composition Patterns
- Parent-to-child props: App passes onNavigate, viewMode, currentScreen, onLogout to Sidebar and MobileNav.
- Child-to-parent callbacks: Sidebar/MobileNav call navigateTo to update currentScreen.
- State-driven composition: renderScreen() composes the active screen based on state.
- Cross-cutting concerns: ErrorBoundary and Suspense wrap the screen area.

```mermaid
graph LR
App["App.tsx"] -- "props" --> Sidebar["Sidebar.tsx"]
App -- "props" --> MobileNav["MobileNav.tsx"]
Sidebar -- "navigateTo()" --> App
MobileNav -- "navigateTo()" --> App
App -- "renderScreen()" --> Screen["Lazy Screen"]
```

**Diagram sources**
- [App.tsx](file://App.tsx#L341-L347)
- [Sidebar.tsx](file://components/Sidebar.tsx#L27-L124)
- [MobileNav.tsx](file://components/MobileNav.tsx#L11-L94)

**Section sources**
- [App.tsx](file://App.tsx#L341-L347)
- [Sidebar.tsx](file://components/Sidebar.tsx#L27-L124)
- [MobileNav.tsx](file://components/MobileNav.tsx#L11-L94)

### Example Screens: StudentDashboard and AdminCatalog
- StudentDashboard: Displays progress and stats, navigates to achievements and attendance.
- AdminCatalog: Manages content catalog with tabs, filters, forms, and modals.

```mermaid
classDiagram
class StudentDashboard {
+props : onNavigate(screen)
+useEffect() : loadProgress()
+render()
}
class AdminCatalog {
+hooks : useCatalogData(), useCatalogFilters()
+render()
}
App --> StudentDashboard : "renders in student mode"
App --> AdminCatalog : "renders in admin mode"
```

**Diagram sources**
- [StudentDashboard.tsx](file://components/StudentDashboard.tsx#L16-L135)
- [AdminCatalog.tsx](file://components/AdminCatalog.tsx#L37-L200)

**Section sources**
- [StudentDashboard.tsx](file://components/StudentDashboard.tsx#L16-L135)
- [AdminCatalog.tsx](file://components/AdminCatalog.tsx#L37-L200)

## Dependency Analysis
- App.tsx depends on:
  - Firebase auth for authentication lifecycle.
  - Zustand stores for global state and course selection.
  - Types for strict Screen and ViewMode definitions.
  - Lazy-loaded screens for feature modules.
- UI components depend on shared UI primitives (Button, Card, Input) and icons.
- Sidebar and MobileNav depend on types and call navigateTo from App’s store.

```mermaid
graph TB
App["App.tsx"] --> Types["types.ts"]
App --> Stores["appStore.ts / courseStore.ts"]
App --> AuthComp["Auth.tsx"]
App --> NavD["Sidebar.tsx"]
App --> NavM["MobileNav.tsx"]
App --> Err["ErrorBoundary.tsx"]
App --> Lazy["Lazy screens"]
```

**Diagram sources**
- [App.tsx](file://App.tsx#L24-L31)
- [types.ts](file://types.ts#L1-L25)
- [appStore.ts](file://lib/stores/appStore.ts#L1-L82)
- [courseStore.ts](file://lib/stores/courseStore.ts#L1-L27)
- [Auth.tsx](file://components/Auth.tsx#L12-L265)
- [Sidebar.tsx](file://components/Sidebar.tsx#L27-L124)
- [MobileNav.tsx](file://components/MobileNav.tsx#L11-L94)
- [ErrorBoundary.tsx](file://components/ErrorBoundary.tsx#L13-L82)

**Section sources**
- [App.tsx](file://App.tsx#L24-L31)
- [types.ts](file://types.ts#L1-L25)
- [appStore.ts](file://lib/stores/appStore.ts#L1-L82)
- [courseStore.ts](file://lib/stores/courseStore.ts#L1-L27)

## Performance Considerations
- Lazy loading reduces initial bundle size; ensure fallback UI remains responsive.
- Avoid unnecessary re-renders by keeping navigation callbacks stable and minimizing prop drift.
- Use Suspense boundaries close to the UI that needs them to avoid blocking unrelated areas.
- Debounce or throttle frequent state updates (e.g., filters) to reduce re-renders.

## Troubleshooting Guide
Common issues and where to look:
- Authentication loops or incorrect redirects: Verify onAuthStateChanged subscription and setCurrentScreen transitions.
- Unauthorized access UI appears unexpectedly: Check accessChecked, hasAccess, and userRole updates.
- Navigation does not change screen: Confirm navigateTo is called and currentScreen updates in the store.
- Error boundary shows frequently: Inspect child components’ error boundaries and logs.
- Mobile navigation missing: Ensure viewMode is passed and currentScreen is mapped correctly.

**Section sources**
- [App.tsx](file://App.tsx#L65-L108)
- [App.tsx](file://App.tsx#L175-L238)
- [appStore.ts](file://lib/stores/appStore.ts#L62-L78)
- [ErrorBoundary.tsx](file://components/ErrorBoundary.tsx#L19-L25)

## Conclusion
App.tsx serves as the central orchestrator, coordinating authentication, role management, access checks, navigation, and screen rendering. Sidebar and MobileNav provide role-aware navigation, while Auth, ErrorBoundary, and Suspense ensure a resilient user experience. The component tree adapts dynamically to user state and screen mode, with clear separation of concerns and predictable prop flows.
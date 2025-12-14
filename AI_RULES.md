# AI Rules & Guidelines - Fluentoria

## Tech Stack Overview

- **React 19.2.0** with TypeScript for the frontend framework and type safety
- **Vite 6.2.0** as the build tool and development server for fast HMR
- **TailwindCSS 4.1.17** for utility-first styling with custom dark theme design system
- **Firebase 12.6.0** for backend services including Auth, Firestore database, and Storage
- **Lucide React 0.555.0** for consistent iconography throughout the application
- **Recharts 3.5.1** for data visualization in admin reports and analytics

## Library Usage Rules

### UI Components & Styling
- **ALWAYS** use TailwindCSS for styling. No inline styles or CSS modules unless absolutely necessary
- **USE** the existing design system colors defined in `tailwind.config.js` (primary: #FF6A00, background: #0B0B0B, etc.)
- **PREFER** shadcn/ui components when available. They're pre-installed and follow the design system
- **NEVER** edit shadcn/ui component files directly. Create wrapper components if customization is needed
- **MAINTAIN** the dark theme consistency. All components should use dark color schemes

### Icons & Visual Elements
- **USE** Lucide React for all icons. They're installed and match the design language
- **NEVER** use other icon libraries unless specifically requested
- **MAINTAIN** consistent icon sizes and colors using Tailwind classes

### Firebase Integration
- **USE** the existing Firebase configuration in `lib/firebase.ts`
- **FOLLOW** the established patterns in `lib/db.ts` for Firestore operations
- **USE** Firebase Auth for all authentication. No other auth providers
- **STORE** files in Firebase Storage using the patterns in `lib/media.ts`
- **NEVER** expose Firebase config keys directly in components. Use the environment variables

### State Management & Data Flow
- **USE** React hooks (useState, useEffect) for local component state
- **FOLLOW** the existing data fetching patterns in library files
- **NEVER** use external state management libraries unless specifically requested
- **KEEP** business logic in library files, not in components

### File Structure & Organization
- **COMPONENTS** go in `src/components/`. Create one file per component
- **UTILITIES** go in `src/lib/`. Group related functions together
- **TYPES** go in `src/types.ts`. Add new interfaces as needed
- **PAGES** go in `src/pages/`. The main page is `src/pages/Index.tsx`
- **KEEP** components under 100 lines. Refactor larger components

### Forms & Inputs
- **USE** the `AnimatedInput` component for all form inputs
- **USE** the `AIInput` component for chat/message inputs
- **FOLLOW** the existing form patterns in components like `CourseForm.tsx`
- **NEVER** create custom input components without checking existing ones first

### Media & File Handling
- **USE** the `MediaUpload` component for all file uploads
- **FOLLOW** the patterns in `lib/media.ts` for file operations
- **SUPPORT** images, videos, audio, and PDFs
- **NEVER** implement custom file upload logic without using existing utilities

### Gamification & Progress Tracking
- **USE** the functions in `lib/gamification.ts` for XP, levels, and achievements
- **FOLLOW** the existing patterns for progress tracking
- **NEVER** create separate gamification systems

### Error Handling
- **NEVER** use try/catch blocks unless specifically requested
- **LET** errors bubble up to be handled at the appropriate level
- **LOG** errors to console for debugging

### Performance & Optimization
- **LAZY** load components when appropriate
- **USE** React.memo for expensive components if needed
- **OPTIMIZE** images and media files
- **NEVER** over-optimize prematurely

### Code Quality
- **FOLLOW** TypeScript best practices. Use proper types
- **KEEP** functions small and focused
- **USE** descriptive variable and function names
- **COMMENT** complex logic when necessary
- **MAINTAIN** consistent code style with existing codebase

### Authentication & Authorization
- **USE** Firebase Auth with Google Sign-In
- **CHECK** user roles before showing admin features
- **REDIRECT** appropriately based on user role (student/admin)
- **NEVER** bypass authentication checks

### Responsive Design
- **ALWAYS** design mobile-first
- **USE** Tailwind's responsive prefixes (md:, lg:, etc.)
- **TEST** components on different screen sizes
- **USE** the existing MobileNav component for mobile navigation

### Content Management
- **USE** the existing CRUD operations in `lib/db.ts`
- <!-- **FOLLOW** the patterns for courses, daily contacts, mindful flows, and music (Daily Contact disabled) -->
- **NEVER** create duplicate content management systems

### Testing & Debugging
- **USE** console.log for debugging during development
- **TEST** all user flows before committing
- **VERIFY** Firebase security rules when implementing new features
- **CHECK** browser console for errors regularly

## Prohibited Practices

- **DO NOT** install new packages without checking if they're already available
- **DO NOT** use external CSS frameworks or libraries
- **DO NOT** implement authentication from scratch
- **DO NOT** create duplicate components or utilities
- **DO NOT** hardcode configuration values
- **DO NOT** use deprecated React patterns (class components, componentWillMount, etc.)
- **DO NOT** ignore TypeScript errors
- **DO NOT** commit code with console.error statements (unless for specific error handling)

## Remember

- **KEEP IT SIMPLE** - Don't over-engineer solutions
- **CONSISTENCY IS KEY** - Follow existing patterns
- **THINK REUSABILITY** - Create components that can be used elsewhere
- **USER EXPERIENCE FIRST** - Maintain the dark theme and smooth interactions
- **SECURITY MATTERS** - Never expose sensitive data or bypass auth

When in doubt, check existing implementations and follow the established patterns. The codebase is well-structured and most common use cases already have patterns to follow.
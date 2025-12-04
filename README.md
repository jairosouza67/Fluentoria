# 🌐 Fluentoria - English Language Learning Platform

![Fluentoria Logo](./public/logo.png)

**Fluentoria** is a modern, interactive English language learning platform built with React and Vite. It combines structured course learning, gamification, daily engagement activities, and comprehensive admin management tools to provide an engaging learning experience.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Student Features](#student-features)
- [Admin Features](#admin-features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Running the Application](#running-the-application)
- [Component Documentation](#component-documentation)
- [Library Functions](#library-functions)
- [Authentication & Authorization](#authentication--authorization)

---

## 🎓 Overview

Fluentoria is a comprehensive Learning Management System (LMS) designed specifically for English language learners. It provides a dual-mode interface supporting both **student** and **admin** roles, with features for course management, progress tracking, gamification, and interactive learning activities.

### Key Characteristics:
- 🎨 **Dark-themed UI** with modern gradient design
- 📱 **Fully Responsive** - Works seamlessly on mobile and desktop
- 🔐 **Firebase Authentication** - Secure Google login integration
- 🎮 **Gamification System** - XP, levels, achievements, and leaderboards
- 📊 **Real-time Analytics** - Student progress tracking and activity monitoring
- 🛠️ **Dual Role Management** - Separate student and admin interfaces

---

## ✨ Core Features

### 🎓 Student Features

#### 1. **Dashboard**
- Overview of learning progress
- Quick access to all learning modules
- Visual statistics (completed courses, hours studied, current streak)
- Personalized recommendations

#### 2. **Courses Module**
- Browse and access structured English courses
- Video content integration (YouTube support)
- Course progress tracking
- Detailed course information with descriptions
- Course chat for student-instructor interaction
- Media submission (audio/video recordings for practice)

#### 3. **Daily Contact**
- Daily engagement activities to maintain learning consistency
- Unique completion tracking per day
- Interactive exercises designed for daily practice
- Motivational content delivery

#### 4. **Mindful Flow**
- Relaxation and stress-relief focused learning sessions
- Mindfulness-based English practice
- Curated content library
- Progress tracking for wellness activities

#### 5. **Music Learning**
- Learn English through music
- Song-based vocabulary and listening comprehension
- Audio playback with lyrics
- Music-themed exercises

#### 6. **Profile Management**
- User profile information
- Google avatar auto-fetch on login
- Personalized user settings
- Account management

#### 7. **Gamification System**

**Achievements:**
- Unlock badges based on milestones
- Achievement types:
  - 🏆 First course completion
  - 📈 Course streak (consecutive course completions)
  - 💪 Daily contact consistency
  - ⏱️ Study hours milestone
  - 🎤 Media upload milestone

**Leaderboard:**
- Global ranking system
- Student rankings based on XP points
- Real-time position updates
- Competitive learning environment

**XP & Level System:**
- Earn XP through course completion and activities
- Progress through levels (Level 1 → Level N)
- Visual progress indicators

#### 8. **Attendance Tracker**
- Automatic activity tracking
- Daily attendance records
- Streak maintenance (consecutive days of activity)
- Attendance history and statistics

---

### 🔧 Admin Features

#### 1. **Dashboard (Reports)**
- Overall platform statistics
- Student activity overview
- Course engagement metrics
- System health indicators
- Active/inactive student counts

#### 2. **Content Management (Courses/Aulas)**
- Create new courses
- Edit existing courses
- Manage course videos and descriptions
- Set course visibility and availability
- Bulk course operations

#### 3. **Student Management**
- View all enrolled students
- Monitor student progress
- Access detailed student analytics
- View student achievements
- Student activity history
- Role assignment and management

#### 4. **Settings**
- Application configuration
- System preferences
- User management settings
- Course default settings

#### 5. **Help & Support**
- System documentation
- User guides
- Troubleshooting information
- Contact information

---

## 🏗️ Technology Stack

### Frontend Framework
- **React 19.2.0** - UI library with hooks
- **TypeScript** - Type-safe development
- **Vite 6.2.0** - Fast build tool and dev server

### Styling
- **TailwindCSS 4.1.17** - Utility-first CSS framework
- **PostCSS 8.5.6** - CSS transformations

### Backend & Database
- **Firebase 12.6.0**
  - Authentication (Google Sign-In)
  - Firestore (Real-time database)
  - Cloud Storage (File uploads)
  - Service Workers (PWA support)

### UI Components & Icons
- **Lucide React 0.555.0** - Modern icon library
- **Recharts 3.5.1** - Data visualization charts

---

## 📁 Project Structure

```
Fluentoria/
├── components/                    # React components
│   ├── ui/
│   │   ├── AnimatedInput.tsx     # Custom animated input component
│   │   └── ai-input.tsx          # AI-enhanced input for discussions
│   ├── Auth.tsx                  # Google authentication
│   ├── StudentDashboard.tsx      # Student home screen
│   ├── AdminCatalog.tsx          # Admin course management
│   ├── Students.tsx              # Student list management
│   ├── Reports.tsx               # Admin dashboard/reports
│   ├── Settings.tsx              # System settings
│   ├── CourseList.tsx            # Student course browsing
│   ├── CourseDetail.tsx          # Course view with content
│   ├── CourseChat.tsx            # Course discussion
│   ├── CourseForm.tsx            # Course creation/editing
│   ├── DailyContact.tsx          # Daily activities
│   ├── MindfulFlowList.tsx       # Mindful flow content
│   ├── MusicList.tsx             # Music learning
│   ├── MediaUpload.tsx           # File upload handler
│   ├── Profile.tsx               # User profile
│   ├── Achievements.tsx          # Achievement system
│   ├── Leaderboard.tsx           # Student rankings
│   ├── AttendanceTracker.tsx     # Attendance records
│   ├── Sidebar.tsx               # Navigation sidebar
│   ├── MobileNav.tsx             # Mobile navigation
│   ├── Help.tsx                  # Help page
│   └── LevelProgress.tsx         # Level progress indicator
│
├── lib/                          # Utility functions & services
│   ├── firebase.ts               # Firebase configuration
│   ├── db.ts                     # Database operations
│   ├── media.ts                  # File upload handling
│   ├── messages.ts               # Chat/messaging logic
│   ├── gamification.ts           # Achievement & XP system
│   ├── attendance.ts             # Attendance tracking
│   └── youtube.ts                # YouTube video handling
│
├── public/                       # Static assets
│   ├── manifest.json             # PWA manifest
│   ├── service-worker.js         # Service worker
│   └── logo.png                  # Fluentoria logo
│
├── App.tsx                       # Main application component
├── types.ts                      # TypeScript type definitions
├── index.tsx                     # Application entry point
├── index.css                     # Global styles
├── tailwind.config.js            # Tailwind configuration
├── vite.config.ts                # Vite configuration
└── tsconfig.json                 # TypeScript configuration
```

---

## 📦 Installation & Setup

### Prerequisites
- Node.js 16+ installed
- npm or pnpm package manager
- Firebase project created
- Google OAuth credentials


## 🔐 Authentication & Authorization

### Login Flow
1. User clicks Google Sign-In
2. Firebase authenticates user
3. User document created in Firestore
4. User role loaded (admin/student)
5. Appropriate dashboard displayed

### Role-Based Access Control
```typescript
// Student Role
- Access to courses, daily activities, music, mindful flow
- Can view own profile and achievements
- Can view leaderboard (read-only)
- Can upload media to courses

// Admin Role
- Full access to student management
- Course creation and editing
- System reports and analytics
- Settings management
- Access to all student data
```

### Authorization Check
```typescript
const toggleViewMode = () => {
  if (userRole !== 'admin') {
    alert('Access denied. Only administrators can access this area.');
    return;
  }
  // Switch to admin view
};
```

---

## 🎨 Styling & Theme

- **Color Scheme**: Dark theme with orange accent (#FF6A00)
- **Background**: Deep black (#0B0B0B)
- **Text**: Light gray (#F3F4F6)
- **Accents**: Gradient orange (#FF6A00 to #E15B00)
- **Borders**: Subtle white with transparency

---

## 📱 Mobile & PWA Support

- Progressive Web App (PWA) enabled
- Service Worker for offline support
- Mobile-optimized navigation
- Responsive design for all screen sizes
- Installation support on Android/iOS

---

## 🤝 Contributing

Contributions are welcome! Please follow the existing code style and structure.

---

## 📝 License

This project is proprietary software. All rights reserved.

---

## 📞 Support

For issues, questions, or feature requests, please contact the development team.

---

**Fluentoria** - Making English Learning Engaging & Accessible 🌍
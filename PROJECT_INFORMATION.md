# TalentTrek: Job Portal with Resume Customization

## Project Overview

### Introduction

#### Purpose and Scope of TalentTrek

TalentTrek is a comprehensive job portal platform designed to streamline the job search and application process. It addresses critical pain points in the modern job market by providing an integrated system for job discovery, application management, and user interaction tracking. The platform specifically targets technology professionals seeking roles across various specializations while offering specialized features for visa sponsorship needs and new graduates.

The scope encompasses:
- A centralized job listings dashboard with multi-dimensional filtering
- Personalized application tracking with status history
- Intelligent user interaction tracking to improve user experience
- Authentication and user profile management
- Database integration with PostgreSQL for robust data persistence

#### Goals and Objectives

1. **Primary Goals**:
   - Create a unified platform for job seekers to discover and apply to relevant opportunities
   - Provide comprehensive application tracking capabilities
   - Reduce friction in the job application process
   - Implement user-specific interaction tracking to prevent repetitive prompts

2. **Key Objectives**:
   - Develop a responsive, intuitive UI using modern web technologies
   - Implement secure authentication with industry-standard practices
   - Create a flexible database schema that accommodates various job types
   - Build an API layer that efficiently manages data flow between UI and database
   - Enable personalized job filtering based on user preferences (H1B sponsorship, job categories)

### Proposed Areas of Study and Academic Contribution

TalentTrek contributes to several academic and practical domains:

1. **Human-Computer Interaction (HCI)**:
   - Studies the effectiveness of user interaction tracking in reducing application friction
   - Implements best practices in job search interface design

2. **Database Systems**:
   - Demonstrates practical implementation of relational database design with ORM integration
   - Explores efficient query patterns for job listings and user interactions

3. **Web Application Architecture**:
   - Showcases a modern server-side rendering approach with Next.js
   - Implements the Context API pattern for state management

4. **Software Engineering Patterns**:
   - Applies repository pattern for data access abstraction
   - Demonstrates effective API design for server-client communication

### Current State of the Art

The current job portal landscape includes several established players:

1. **Traditional Job Boards** (LinkedIn, Indeed):
   - Offer vast job listings but limited personalization
   - Typically lack comprehensive application tracking
   - Don't maintain user interaction history across job listings

2. **Applicant Tracking Systems** (Greenhouse, Lever):
   - Focus on employer needs rather than candidate experience
   - Limited integration between job discovery and application tracking

3. **Specialized Tech Job Platforms** (AngelList, StackOverflow Jobs):
   - Target tech professionals but offer limited filtering options
   - May not address specific needs like visa sponsorship filtering

TalentTrek differentiates itself through:
- User-centric design focusing on the candidate journey
- Integration of intelligent interaction tracking to improve UX
- Specialized filtering for technology professionals (H1B sponsorship, job categories)
- Comprehensive application tracking with status history

## Project Architecture

### Introduction

TalentTrek employs a modern web architecture that prioritizes performance, maintainability, and user experience. The architecture follows a hybrid server-client rendering approach using Next.js, combining the benefits of server-side rendering (SSR) for initial page loads with client-side interactivity.

### Architecture Subsystems

#### Job Scraping and Search Subsystem

The job data management subsystem is responsible for:

1. **Data Ingestion**:
   - Script-based job data import from CSV sources
   - Data validation and normalization before storage
   - Content hash generation to prevent duplicates

2. **Search and Filtering**:
   - Server-side implementation of job search functionality
   - Category-based filtering with pagination support
   - Specialized filters for H1B sponsorship and new graduate positions

3. **Jobs Database**:
   - PostgreSQL tables for storing job listings and metadata
   - Optimized indexes for query performance
   - Regular job data refresh mechanisms

**Architecture Diagram for Job Search Subsystem:**
```
CSV Data Source → Import Scripts → PostgreSQL Database → 
Next.js API Routes → React Components → User Interface
```

#### Authentication and Application Tracking

1. **Authentication Subsystem**:
   - AWS Amplify/Cognito integration for secure user authentication
   - JWT token-based session management
   - Custom AuthContext for global authentication state
   - Registration, login, and email verification flows

2. **Application Tracking Subsystem**:
   - Database tables for tracking user applications
   - Status history with timestamp tracking
   - Notes and metadata for each application stage
   - API endpoints for CRUD operations on applications

3. **User Interaction Tracking**:
   - Job viewing, application, and declination tracking
   - Intelligent prompting based on previous interactions
   - Database tables optimized for interaction queries
   - Privacy-focused design with minimal data collection

**Architecture Diagram for Application Tracking:**
```
User Interface → React Components → API Routes → 
Database Access Layer → PostgreSQL Database
```

## Technology Descriptions

### Client Technologies

1. **React 18**:
   - Core UI library for component-based architecture
   - Utilizes hooks for state management and side effects
   - Provides efficient reconciliation for DOM updates

2. **Next.js 15**:
   - React framework with SSR and static generation capabilities
   - App Router for file-system based routing
   - API routes for serverless backend functions
   - Server components for improved performance

3. **Tailwind CSS**:
   - Utility-first CSS framework for responsive design
   - Custom component library built on Tailwind primitives
   - Consistent design language across the application
   - Optimized for production with minimal CSS output

4. **Context API**:
   - React's built-in state management solution
   - Used for authentication state and user information
   - Provides global state access without prop drilling

### Middle-Tier Technologies

1. **Next.js API Routes**:
   - Serverless functions for backend logic
   - RESTful endpoints for data operations
   - Integrated with the same codebase as frontend

2. **AWS Amplify/Cognito**:
   - Authentication service for secure user management
   - Token-based authentication flow
   - Email verification and password reset capabilities

3. **Prisma ORM**:
   - Type-safe database access layer
   - Schema definition and migration management
   - Query building with protection against SQL injection

### Data-Tier Technologies

1. **PostgreSQL**:
   - Relational database for structured data storage
   - Advanced indexing for query optimization
   - Vector extension for potential future search improvements
   - Robust transaction support for data integrity

2. **Database Schema Design**:
   - Normalized tables with appropriate relationships
   - Optimized for read-heavy job listings display
   - Specialized tables for user interactions and applications
   - Timestamp tracking for all critical operations

3. **Migration Scripts**:
   - SQL migration files for database structure changes
   - Version control for database schema
   - Rollback capabilities for failed migrations

## Module Descriptions

### Module 1 - Job Portal Frontend

#### Overview & Goals

The Job Portal Frontend module serves as the primary interface for users to discover and interact with job listings. It implements a responsive, intuitive UI that enables efficient job browsing, filtering, and application.

**Key Goals:**
1. Present job listings in an easily scannable format
2. Provide multi-dimensional filtering capabilities
3. Enable one-click job application process
4. Track user interactions with job listings
5. Deliver a responsive experience across devices

#### Design

The frontend design follows a component-based architecture using React, with several key components:

1. **Dashboard Page** (`/src/app/(routes)/dashboard/page.tsx`):
   - Server-side rendered main page component
   - Fetches and provides job data to child components
   - Handles URL-based filtering parameters
   - Implements error handling for data fetching failures

2. **JobListings Component** (`/src/components/job-listings/JobListings.tsx`):
   - Container component for job listing display
   - Manages pagination and category filtering UI
   - Renders collection of JobListingCard components
   - Handles empty states and loading indicators

3. **JobListingCard Component** (`/src/components/job-listings/JobListingCard.tsx`):
   - Individual job card with detailed information
   - Implements the apply flow with modal confirmation
   - Tracks user interactions (viewed, applied, declined)
   - Manages application state with database integration

4. **UI Component Library** (`/src/components/ui/*`):
   - Reusable UI primitives for consistent design
   - Button, Dialog, Badge, and other common components
   - Built on Tailwind CSS for responsive styling

**Data Flow Design:**
```
Server-Side:
Database → getJobListings() → JobListings → JobListingCard

Client-Side Interactions:
JobListingCard → User Actions → API Calls → Database Updates
```

#### Implementation Details

##### Job Listing Retrieval and Display

The job listing retrieval process is implemented in the Dashboard page component:

```typescript
// Key implementation in dashboard/page.tsx
async function getJobListings(page: number, category: string) {
  // SQL query implementation with pagination and category filtering
  const jobsQuery = `
    SELECT * FROM job_listings 
    ${whereClause}
    ORDER BY posting_date DESC
    LIMIT $${category ? 2 : 1} OFFSET $${category ? 3 : 2}
  `;
  
  // Execute query and transform data for frontend consumption
  const jobs = jobsResult.rows.map(row => ({
    id: row.id,
    positionTitle: row.position_title,
    company: row.company,
    // Additional fields mapped here...
  }));
  
  return { jobs, totalPages, allCategories };
}
```

##### User Interaction Tracking

The application implements sophisticated user interaction tracking in the JobListingCard component:

```typescript
// Simplified interaction tracking logic
useEffect(() => {
  const checkApplicationStatus = async () => {
    // Check if user has applied
    const appliedResponse = await fetch(`/api/interactions?userId=${user.id}&jobId=${job.id}&type=applied`);
    
    // Check if user has declined
    const declinedResponse = await fetch(`/api/interactions?userId=${user.id}&jobId=${job.id}&type=declined`);
    
    // Check if user has viewed but not decided
    const viewedResponse = await fetch(`/api/interactions?userId=${user.id}&jobId=${job.id}&type=viewed`);
    
    // Set UI state based on interaction history
    // ...
  };
  
  checkApplicationStatus();
}, [job.id, user?.id]);
```

#### Testing & Verification

The Job Portal Frontend module undergoes several testing approaches:

1. **Component Testing**:
   - Individual component rendering verification
   - Props and state management testing
   - User interaction simulation

2. **Integration Testing**:
   - Data flow between components
   - API interaction testing
   - Authentication state handling

3. **User Experience Testing**:
   - Performance testing for page load times
   - Cross-browser compatibility verification
   - Responsive design testing across device sizes

4. **Verification Metrics**:
   - Time to first meaningful paint under 1.5 seconds
   - Successful job application flow completion rate > 95%
   - Filter response time under 500ms

### Module 2 - Authentication

#### Overview & Goals

The Authentication module provides secure user management throughout the TalentTrek platform. It implements industry-standard authentication practices using AWS Amplify/Cognito while maintaining a smooth user experience.

**Key Goals:**
1. Implement secure user registration and login flows
2. Provide email verification for new accounts
3. Maintain session state across the application
4. Protect routes and resources based on authentication status
5. Synchronize user data between authentication service and database

#### Design

The authentication system is designed around a centralized AuthContext that provides authentication state and functions to the entire application:

1. **AuthContext** (`/src/contexts/AuthContext.tsx`):
   - React context provider for authentication state
   - Methods for sign-in, sign-up, sign-out, and verification
   - Session persistence with automatic state recovery

2. **Authentication UI**:
   - Login page with credential validation
   - Registration form with field validation
   - Email verification page with code submission
   - Password reset functionality

3. **AWS Amplify Integration**:
   - Configuration for Cognito user pools
   - JWT token management for session state
   - Secure attribute storage for user metadata

#### Implementation Details

##### Authentication Context

The AuthContext implementation provides the authentication backbone:

```typescript
// Key implementation in AuthContext.tsx
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  
  // Check authentication state on component mount
  useEffect(() => { 
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const currentUser = await awsGetCurrentUser();
      const attributes = await awsFetchUserAttributes();
      
      setUser({
        id: currentUser.userId,
        username: currentUser.userId,
        email: attributes.email || '',
        name: attributes.name || ''
      });
      
      setIsAuthenticated(true);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
    }
  };
  
  // Authentication method implementations
  const handleSignIn = async (username: string, password: string) => {
    // Implementation details...
  };
  
  // Additional auth methods...
};
```

##### User Database Synchronization

After successful authentication, the system synchronizes user data with the database:

```typescript
// User database creation after verification
const handleConfirmSignUp = async (username: string, code: string) => {
  try {
    await awsConfirmSignUp({
      username,
      confirmationCode: code
    });
    
    // Get user details
    const email = sessionStorage.getItem('pendingEmail') || '';
    const name = sessionStorage.getItem('pendingName') || '';
    
    // Sign in to get Cognito user ID
    await awsSignIn({
      username,
      password: sessionStorage.getItem('pendingPassword') || ''
    });
    
    const currentUser = await awsGetCurrentUser();
    const userId = currentUser.userId;
    
    // Create user in database
    await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        email,
        name
      }),
    });
    
    // Clear temporary storage
    // ...
  } catch (error) {
    // Error handling...
  }
};
```

#### Testing & Verification

The Authentication module testing focuses on security and reliability:

1. **Security Testing**:
   - Penetration testing for authentication endpoints
   - Token validation and expiration verification
   - CSRF protection testing

2. **Functional Testing**:
   - Registration flow completion
   - Login with valid/invalid credentials
   - Password reset functionality
   - Session persistence

3. **Error Handling Testing**:
   - Invalid input handling
   - Network failure scenarios
   - Account recovery flows

## Testing and Verification

### Strategy for Inter-Module Testing

TalentTrek employs a comprehensive testing strategy that verifies functionality both within and across modules:

1. **Cross-Module User Flows**:
   - Authentication → Job Listings → Application Submission
   - Application Submission → My Applications View
   - User Interaction → Subsequent Job Viewing Experience

2. **Data Consistency Testing**:
   - User data consistency between authentication and database
   - Job application status consistency across views
   - Interaction history accuracy across sessions

3. **Error Propagation Testing**:
   - Database failure handling across modules
   - Authentication expiration handling in protected routes
   - API error propagation to UI components

### Unit Testing

Unit tests focus on isolated functionality:

1. **Component Unit Tests**:
   - Rendering verification for UI components
   - Function output validation for utility functions
   - State management verification for hooks

2. **API Route Unit Tests**:
   - Request handling for various input scenarios
   - Response format validation
   - Error handling verification

3. **Database Access Unit Tests**:
   - Query correctness for data retrieval
   - Transaction integrity for data modifications
   - Edge case handling for unusual data

### Integration Testing

Integration tests verify the connections between components:

1. **Frontend Integration**:
   - Component composition and data flow
   - State sharing between components
   - Event propagation across component boundaries

2. **Backend Integration**:
   - API routes with database services
   - Authentication with protected routes
   - Error handling across the stack

3. **End-to-End Testing**:
   - Complete user flows from login to application
   - Cross-browser functionality verification
   - Mobile responsiveness testing

## Deployment, Operations, Maintenance

### Deployment Strategy

TalentTrek is designed for flexible deployment options:

1. **Production Deployment**:
   - Next.js application hosted on Vercel or similar platform
   - PostgreSQL database on managed cloud service
   - Environment variables for configuration management
   - CI/CD pipeline for automated deployments

2. **Database Deployment**:
   - Migration scripts for initial schema creation
   - Version control for schema changes
   - Backup and recovery procedures

3. **Scaling Strategy**:
   - Horizontal scaling for web tier
   - Connection pooling for database access
   - Caching for frequently accessed data

### Operations and Monitoring

Operational concerns are addressed through:

1. **Monitoring Setup**:
   - Application performance monitoring
   - Error tracking and alerting
   - Database query performance analysis
   - User experience metrics collection

2. **Logging Strategy**:
   - Structured logging for application events
   - Authentication activity logging
   - Database operation logging
   - Error logging with context

3. **Maintenance Procedures**:
   - Database index optimization
   - Regular security updates
   - Dependency management and updates
   - Performance optimization

### Maintenance Plan

Ongoing maintenance includes:

1. **Database Maintenance**:
   - Regular index rebuilding
   - Query optimization based on usage patterns
   - Data archiving strategy for old listings

2. **Code Maintenance**:
   - Technical debt reduction
   - Refactoring for improved maintainability
   - Documentation updates

3. **Feature Evolution**:
   - User feedback incorporation
   - A/B testing for UI improvements
   - Performance optimization based on metrics

## Summary, Conclusions, and Recommendations

### Summary

TalentTrek represents a comprehensive solution to common challenges in the job search process. By integrating job discovery, application tracking, and user interaction history, it creates a seamless experience for job seekers. The platform's architecture leverages modern web technologies to deliver a responsive, maintainable, and scalable application.

Key achievements include:
- A responsive job listings interface with multi-dimensional filtering
- Secure authentication with AWS Amplify/Cognito
- Intelligent user interaction tracking to improve UX
- Comprehensive application status tracking
- Database design optimized for the job search domain

### Conclusions

The TalentTrek project demonstrates several important principles:

1. **User-Centered Design**:
   - Tracking user interactions significantly improves the job search experience
   - Personalized job filtering increases relevance for users
   - Application tracking provides valuable organization for job seekers

2. **Technical Architecture**:
   - Next.js provides an excellent foundation for both frontend and API needs
   - PostgreSQL offers robust data storage for job-related information
   - React's component model enables maintainable UI development

3. **Development Approach**:
   - Iterative development allowed for continuous refinement
   - Component-based architecture facilitated code reuse
   - Type safety with TypeScript prevented many potential bugs

### Recommendations for Further Research

Several areas present opportunities for future research and development:

1. **AI Integration**:
   - Implement job recommendation algorithms based on user interactions
   - Add resume parsing for personalized job matching
   - Develop AI-powered interview preparation tools

2. **Enhanced Search Capabilities**:
   - Implement full-text search with PostgreSQL's vector extension
   - Add semantic search capabilities for job descriptions
   - Develop advanced filtering based on skills and qualifications

3. **Social Features**:
   - Add company reviews and ratings
   - Implement networking features for connected job seekers
   - Develop referral tracking mechanisms

4. **Mobile Application**:
   - Develop dedicated mobile applications for iOS and Android
   - Implement push notifications for application updates
   - Add offline capabilities for job browsing

TalentTrek provides a solid foundation that can evolve to address these future opportunities while maintaining its core focus on improving the job search experience.

## Database Schema

### Core Tables

1. **`users`**
   - `id`: Primary key (UUID)
   - `email`: User email (unique)
   - `name`: User's full name
   - `created_at`: Timestamp of account creation
   - `updated_at`: Timestamp of last update

2. **`job_listings`**
   - `id`: Primary key (auto-incrementing)
   - `position_title`: Job title
   - `company`: Company name
   - `location`: Job location
   - `work_model`: Remote/Hybrid/On-site
   - `salary`: Salary information
   - `h1b_sponsored`: Boolean indicating visa sponsorship
   - `is_new_grad`: Boolean for entry-level positions
   - `job_category`: Category of the job
   - Various timestamps and metadata

3. **`user_applications`**
   - `id`: Primary key
   - `job_listing_id`: Foreign key to job_listings
   - `user_id`: Foreign key to users
   - `current_status`: Application status
   - `applied_at`: Application timestamp
   - `notes`: Optional notes

4. **`application_status_history`**
   - `id`: Primary key
   - `user_application_id`: Foreign key to user_applications
   - `status`: Status value
   - `changed_at`: Timestamp of status change
   - `notes`: Optional notes for the status change

5. **`user_job_interactions`**
   - `id`: Primary key
   - `user_id`: Foreign key to users
   - `job_listing_id`: Foreign key to job_listings
   - `interaction_type`: Type of interaction (viewed, applied, declined)
   - `created_at`: Timestamp of interaction
   - `updated_at`: Timestamp of last update

### Key Database Functions

1. **`track_job_interaction`**
   - Records user interactions with job listings
   - Parameters: user_id, job_listing_id, interaction_type
   - Handles conflict resolution for duplicate interactions

2. **`update_updated_at_column`**
   - Trigger function to automatically update timestamp fields

## Setup and Installation

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Git

### Installation Steps

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Job-Portal-with-Resume-Customization
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the database:
   ```bash
   createdb joblistingsportal
   psql -d joblistingsportal -f src/db/migrations/05_create_user_job_interactions.sql
   ```

4. Create a `.env.local` file:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/joblistingsportal"
   JWT_SECRET="your-secure-random-string"
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Access the application at http://localhost:3000 
# Product Requirements Document (PRD)
# FieldLines Pro - Sportsfield Line Marking Platform

**Version:** 1.0  
**Date:** December 11, 2025  
**Status:** Draft  
**Author:** Product Team

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Objectives](#3-goals--objectives)
4. [Target Users](#4-target-users)
5. [User Stories](#5-user-stories)
6. [Functional Requirements](#6-functional-requirements)
7. [Technical Requirements](#7-technical-requirements)
8. [Soccer Field Specifications](#8-soccer-field-specifications)
9. [MVP Scope](#9-mvp-scope)
10. [User Interface & Experience](#10-user-interface--experience)
11. [Future Phases](#11-future-phases)
12. [Success Metrics](#12-success-metrics)
13. [Risks & Mitigations](#13-risks--mitigations)
14. [Appendix](#14-appendix)

---

## 1. Executive Summary

**FieldLines Pro** is a web-based platform that enables sports facility managers, schools, councils, and clubs to design, visualize, and request professional line marking services for their sportsgrounds. Users can locate their field using satellite imagery, overlay regulation-compliant field templates, customize dimensions, and submit booking requests directly to the line marking service provider.

The MVP focuses on **soccer (football) line markings** with the **11v11 full field template**, establishing the foundational platform architecture that will support additional sports and field configurations in future releases.

---

## 2. Problem Statement

### Current Challenges

**For Customers:**
- Difficulty communicating exact field requirements and dimensions to line marking providers
- Uncertainty about regulation-compliant field sizes for different competition levels
- No visual confirmation of how markings will appear on their specific ground
- Manual back-and-forth communication to schedule and confirm services
- No centralized record of their field configurations and marking history

**For Line Marking Providers:**
- Time-consuming site visits to assess and measure fields
- Miscommunication about customer requirements leading to rework
- Manual scheduling and booking management
- Difficulty providing accurate quotes without visual references
- No systematic way to manage recurring service schedules

### Opportunity

A digital platform that bridges the communication gap between customers and providers, enabling visual field design, accurate dimension specifications, and streamlined booking processes.

---

## 3. Goals & Objectives

### Primary Goals

| Goal | Description | Success Indicator |
|------|-------------|-------------------|
| **Streamline Booking** | Reduce time from initial inquiry to confirmed booking | 50% reduction in booking cycle time |
| **Visual Accuracy** | Enable customers to design fields that match their exact requirements | 90% of jobs require no on-site modifications |
| **Customer Self-Service** | Allow customers to manage their own field configurations | 80% of bookings submitted through platform |
| **Operational Efficiency** | Centralize job requests and scheduling | All bookings managed through single system |

### MVP Objectives

1. Launch functional platform with soccer 11v11 field template
2. Onboard first 20 beta customers
3. Process 50 booking requests through the platform
4. Achieve 4+ star average user satisfaction rating
5. Validate core value proposition before expanding to additional sports

---

## 4. Target Users

### Primary Users (Customers)

| User Type | Description | Key Needs |
|-----------|-------------|-----------|
| **Sports Club Managers** | Manage multiple fields for clubs | Easy reordering, recurring schedules |
| **School Groundskeepers** | Maintain school sporting facilities | Simple interface, budget tracking |
| **Council/Local Government** | Oversee public sporting reserves | Multi-field management, reporting |
| **Private Facility Owners** | Own commercial sports complexes | Professional presentation, customization |

### Secondary Users (Internal)

| User Type | Description | Key Needs |
|-----------|-------------|-----------|
| **Operations Team** | Process and schedule jobs | Clear job details, calendar view |
| **Field Crews** | Execute line marking work | Accurate specifications, site access |
| **Business Admin** | Manage customers and billing | Customer data, booking history |

### User Personas

**Persona 1: Greg - Club Secretary**
- Age: 52
- Role: Volunteer secretary for suburban soccer club
- Tech Comfort: Moderate (uses email, basic apps)
- Pain Points: Forgets field dimensions, unclear on what to order
- Goals: Quick reordering, consistent field quality

**Persona 2: Sarah - Council Parks Coordinator**
- Age: 38
- Role: Manages 15 sporting reserves for local council
- Tech Comfort: High (uses multiple software systems daily)
- Pain Points: Coordinating multiple fields, seasonal planning
- Goals: Bulk scheduling, reporting, budget management

---

## 5. User Stories

### Authentication & Profile

| ID | User Story | Priority | Acceptance Criteria |
|----|------------|----------|---------------------|
| US-01 | As a new user, I want to create an account so that I can access the platform | Must Have | Email/password registration with verification |
| US-02 | As a returning user, I want to log in securely so that I can access my saved fields | Must Have | Secure authentication with session management |
| US-03 | As a user, I want to manage my profile details so that my contact information is accurate | Must Have | Edit name, phone, email, organization |
| US-04 | As a user, I want to reset my password if I forget it so that I can regain access | Must Have | Email-based password reset flow |

### Sportsground Management

| ID | User Story | Priority | Acceptance Criteria |
|----|------------|----------|---------------------|
| US-05 | As a user, I want to search for my sportsground by address or name so that I can find it easily | Must Have | Search with autocomplete, map centering |
| US-06 | As a user, I want to see satellite imagery of my sportsground so that I can accurately place field markings | Must Have | High-resolution satellite view with zoom |
| US-07 | As a user, I want to add a sportsground to my profile so that I can manage it over time | Must Have | Save ground with name, address, notes |
| US-08 | As a user, I want to manage multiple sportsgrounds so that I can handle all my facilities | Should Have | List view of saved grounds |
| US-09 | As a user, I want to remove a sportsground from my profile so that I can keep my list current | Should Have | Delete with confirmation |

### Field Design & Customization

| ID | User Story | Priority | Acceptance Criteria |
|----|------------|----------|---------------------|
| US-10 | As a user, I want to select a soccer field template (11v11) so that I can place regulation markings | Must Have | Template selector with preview |
| US-11 | As a user, I want to drag and drop the template onto the satellite view so that I can position it accurately | Must Have | Drag-and-drop placement on map |
| US-12 | As a user, I want to rotate the field template so that I can align it with my ground's orientation | Must Have | Rotation handle or input (0-360°) |
| US-13 | As a user, I want to resize the field by dragging corners/edges so that I can adjust to my ground's constraints | Must Have | Proportional resize with handles |
| US-14 | As a user, I want to input exact dimensions (length x width) so that I can set precise measurements | Must Have | Dimension input fields with validation |
| US-15 | As a user, I want interior lines to scale proportionally so that the field remains regulation-compliant | Must Have | Automatic proportional scaling |
| US-16 | As a user, I want to choose the line marking color so that I can match my requirements | Must Have | Color picker/selector |
| US-17 | As a user, I want to see the current dimensions displayed on the field so that I know the exact sizes | Should Have | Dimension labels on field overlay |
| US-18 | As a user, I want to undo/redo my changes so that I can correct mistakes | Should Have | Undo/redo functionality |

### Saving & Managing Configurations

| ID | User Story | Priority | Acceptance Criteria |
|----|------------|----------|---------------------|
| US-19 | As a user, I want to save my field configuration so that I can reuse it for future bookings | Must Have | Save with name, store all parameters |
| US-20 | As a user, I want to load a saved configuration so that I can quickly reorder | Must Have | Load and display saved design |
| US-21 | As a user, I want to edit a saved configuration so that I can make adjustments | Should Have | Modify and re-save |
| US-22 | As a user, I want to delete a saved configuration so that I can remove outdated designs | Should Have | Delete with confirmation |
| US-23 | As a user, I want to duplicate a saved configuration so that I can create variations | Could Have | Clone and modify |

### Booking & Scheduling

| ID | User Story | Priority | Acceptance Criteria |
|----|------------|----------|---------------------|
| US-24 | As a user, I want to request line marking for a specific date/time so that I can schedule the service | Must Have | Date/time picker, submit request |
| US-25 | As a user, I want to add notes to my booking request so that I can communicate special requirements | Must Have | Free-text notes field |
| US-26 | As a user, I want to receive confirmation that my request was submitted so that I know it was received | Must Have | On-screen confirmation + email |
| US-27 | As a user, I want to set up recurring line marking schedules so that I don't have to reorder each time | Should Have | Recurring schedule options |
| US-28 | As a user, I want to view my booking history so that I can track past services | Should Have | List of past bookings |
| US-29 | As a user, I want to cancel or modify a pending booking so that I can adjust plans | Should Have | Edit/cancel with rules |

### Provider Notifications (Internal)

| ID | User Story | Priority | Acceptance Criteria |
|----|------------|----------|---------------------|
| US-30 | As an operator, I want to receive email notifications for new booking requests so that I can respond promptly | Must Have | Email with full job details |
| US-31 | As an operator, I want to see all pending requests in a dashboard so that I can manage workload | Should Have | Admin booking list view |
| US-32 | As an operator, I want to see the customer's field design so that I can prepare for the job | Must Have | View saved design with dimensions |

---

## 6. Functional Requirements

### 6.1 Authentication System

**FR-01: User Registration**
- Email address (required, unique)
- Password (min 8 chars, complexity rules)
- Full name (required)
- Phone number (required)
- Organization name (optional)
- Email verification required before full access

**FR-02: User Login**
- Email/password authentication
- "Remember me" option (30-day session)
- Account lockout after 5 failed attempts (15-minute cooldown)
- Secure session management (JWT or similar)

**FR-03: Password Management**
- Self-service password reset via email
- Password change from profile settings
- Secure token-based reset links (24-hour expiry)

### 6.2 Sportsground Search & Selection

**FR-04: Location Search**
- Integration with mapping service (Google Maps or Mapbox)
- Search by address, suburb, postcode, or place name
- Autocomplete suggestions as user types
- "Use my location" option for mobile users

**FR-05: Satellite Imagery Display**
- High-resolution satellite/aerial imagery
- Zoom levels from street view to close-up field view
- Pan and navigate functionality
- Imagery recency indicator (if available)

**FR-06: Sportsground Saving**
- Save ground with custom name
- Store center coordinates and zoom level
- Add optional notes/description
- Associate with user account
- List view of all saved grounds

### 6.3 Field Template System

**FR-07: Template Selection**
- Template library organized by sport (MVP: Soccer only)
- Sub-categories by field type (MVP: 11v11 Full Field)
- Visual preview of template before placement
- Template information (regulation dimensions, description)

**FR-08: Template Placement**
- Drag template from panel onto map
- Initial placement at map center
- Semi-transparent overlay for positioning
- Snap-to-place functionality

**FR-09: Template Manipulation**
- **Rotation:** 
  - Drag rotation handle
  - Direct angle input (0-360°)
  - Rotation in 1° increments (or 15° snapping option)
- **Resizing:**
  - Corner drag handles for proportional resize
  - Edge drag handles for independent length/width (with aspect lock option)
  - Minimum/maximum size constraints per template
- **Positioning:**
  - Click and drag to reposition after placement
  - Nudge with arrow keys for fine adjustment

**FR-10: Dimension Input**
- Manual entry fields for length (touchline) and width (goal line)
- Real-time update of field overlay when dimensions change
- Validation against min/max constraints
- Display current dimensions on field overlay

**FR-11: Proportional Interior Scaling**
- All interior markings scale proportionally to outer dimensions
- Maintain regulation ratios regardless of field size
- Interior elements include:
  - Center circle
  - Center line
  - Penalty areas (both ends)
  - Goal areas (both ends)
  - Penalty spots
  - Penalty arc
  - Corner arcs

### 6.4 Line Color Selection

**FR-12: Color Options**
- Predefined color palette:
  - White (default/standard)
  - Yellow
  - Blue
  - Orange
  - Red
  - Green (for contrast on brown/dirt surfaces)
- Color preview on field overlay
- Color name/code stored with configuration

### 6.5 Configuration Management

**FR-13: Save Configuration**
- Save current design with user-defined name
- Store all parameters:
  - Sportsground reference
  - Template type
  - Position (lat/long)
  - Rotation angle
  - Dimensions (length x width)
  - Line color
  - Creation date
  - Last modified date

**FR-14: Load Configuration**
- List all saved configurations for user
- Filter by sportsground
- Sort by name or date
- Load and display on map with all settings

**FR-15: Configuration Actions**
- Edit/update existing configuration
- Delete configuration (with confirmation)
- Duplicate configuration
- Rename configuration

### 6.6 Booking Request System

**FR-16: Booking Submission**
- Select saved configuration (or current design)
- Preferred date picker (calendar interface)
- Preferred time picker (morning/afternoon/specific time)
- Alternative date option
- Special instructions/notes (free text, 500 char limit)
- Contact preference (phone/email)
- Terms acceptance checkbox
- Submit button with loading state

**FR-17: Booking Confirmation**
- On-screen success message with reference number
- Email confirmation to customer including:
  - Booking reference number
  - Field design summary
  - Requested date/time
  - Sportsground address
  - Next steps information

**FR-18: Recurring Schedule (Should Have)**
- Frequency options:
  - Weekly
  - Fortnightly
  - Monthly
  - Custom interval
- Duration: number of occurrences or end date
- Day preference for recurring bookings
- Ability to skip/modify individual occurrences

**FR-19: Booking Management**
- View pending bookings list
- View booking details
- Cancel booking (with rules - e.g., 48 hours notice)
- Request modification
- View past/completed bookings

### 6.7 Provider Notification System

**FR-20: Email Notifications**
- Immediate email to operations on new booking
- Email content includes:
  - Customer details (name, phone, email, organization)
  - Sportsground address with map link
  - Field configuration details:
    - Template type
    - Dimensions
    - Line color
    - Rotation/orientation
  - Requested date/time
  - Customer notes
  - Link to view full design in admin panel

**FR-21: Admin Dashboard (Should Have)**
- List of all booking requests
- Filter by status (new/confirmed/completed/cancelled)
- Search by customer or location
- View customer's field design
- Update booking status
- Export booking data

---

## 7. Technical Requirements

### 7.1 Technology Stack (Recommended)

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend** | React or Next.js | Component-based, excellent ecosystem |
| **Mapping** | Mapbox GL JS or Google Maps JavaScript API | High-quality satellite imagery, customizable |
| **Canvas/Drawing** | Fabric.js or Konva.js | Robust 2D canvas manipulation, transforms |
| **Backend** | Node.js with Express or Next.js API routes | JavaScript ecosystem consistency |
| **Database** | PostgreSQL with PostGIS | Relational data + geospatial support |
| **Authentication** | Auth0 or NextAuth.js | Secure, managed auth |
| **Email** | SendGrid or AWS SES | Reliable transactional email |
| **Hosting** | Vercel or AWS | Scalable, reliable hosting |
| **File Storage** | AWS S3 or Cloudinary | Configuration snapshots/exports |

### 7.2 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Auth UI   │  │   Map View  │  │   Field Editor Canvas   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API LAYER                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │  Auth    │  │  Users   │  │  Grounds │  │  Configurations  │ │
│  │  Routes  │  │  Routes  │  │  Routes  │  │  Routes          │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │
│  ┌──────────┐  ┌──────────────────────────────────────────────┐ │
│  │ Bookings │  │           Email Service                      │ │
│  │ Routes   │  │                                              │ │
│  └──────────┘  └──────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    PostgreSQL + PostGIS                    │ │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐ │ │
│  │  │ Users  │ │Grounds │ │Configs │ │Bookings│ │Templates │ │ │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └──────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 7.3 Data Models

**User**
```
{
  id: UUID (PK)
  email: string (unique)
  password_hash: string
  full_name: string
  phone: string
  organization: string (nullable)
  email_verified: boolean
  created_at: timestamp
  updated_at: timestamp
}
```

**Sportsground**
```
{
  id: UUID (PK)
  user_id: UUID (FK → User)
  name: string
  address: string
  latitude: decimal
  longitude: decimal
  default_zoom: integer
  notes: text (nullable)
  created_at: timestamp
  updated_at: timestamp
}
```

**FieldTemplate**
```
{
  id: UUID (PK)
  sport: string (e.g., "soccer")
  name: string (e.g., "11v11 Full Field")
  description: text
  min_length: decimal (meters)
  max_length: decimal (meters)
  min_width: decimal (meters)
  max_width: decimal (meters)
  default_length: decimal (meters)
  default_width: decimal (meters)
  interior_elements: JSONB (see Section 8)
  is_active: boolean
  created_at: timestamp
}
```

**FieldConfiguration**
```
{
  id: UUID (PK)
  user_id: UUID (FK → User)
  sportsground_id: UUID (FK → Sportsground)
  template_id: UUID (FK → FieldTemplate)
  name: string
  latitude: decimal (placement position)
  longitude: decimal (placement position)
  rotation_degrees: decimal (0-360)
  length_meters: decimal
  width_meters: decimal
  line_color: string
  created_at: timestamp
  updated_at: timestamp
}
```

**Booking**
```
{
  id: UUID (PK)
  user_id: UUID (FK → User)
  configuration_id: UUID (FK → FieldConfiguration)
  reference_number: string (unique, e.g., "BK-2025-0001")
  preferred_date: date
  preferred_time: string (e.g., "morning", "14:00")
  alternative_date: date (nullable)
  notes: text (nullable)
  contact_preference: string
  status: enum (pending, confirmed, completed, cancelled)
  recurring_schedule_id: UUID (nullable, FK)
  created_at: timestamp
  updated_at: timestamp
}
```

**RecurringSchedule** (Should Have)
```
{
  id: UUID (PK)
  user_id: UUID (FK → User)
  configuration_id: UUID (FK → FieldConfiguration)
  frequency: enum (weekly, fortnightly, monthly, custom)
  interval_days: integer (for custom)
  preferred_day: string (e.g., "Monday")
  start_date: date
  end_date: date (nullable)
  total_occurrences: integer (nullable)
  is_active: boolean
  created_at: timestamp
}
```

### 7.4 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new user account |
| POST | `/api/auth/login` | Authenticate user |
| POST | `/api/auth/logout` | End user session |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with token |
| GET | `/api/users/me` | Get current user profile |
| PUT | `/api/users/me` | Update user profile |
| GET | `/api/sportsgrounds` | List user's sportsgrounds |
| POST | `/api/sportsgrounds` | Add new sportsground |
| GET | `/api/sportsgrounds/:id` | Get sportsground details |
| PUT | `/api/sportsgrounds/:id` | Update sportsground |
| DELETE | `/api/sportsgrounds/:id` | Remove sportsground |
| GET | `/api/templates` | List available templates |
| GET | `/api/templates/:id` | Get template details |
| GET | `/api/configurations` | List user's configurations |
| POST | `/api/configurations` | Save new configuration |
| GET | `/api/configurations/:id` | Get configuration details |
| PUT | `/api/configurations/:id` | Update configuration |
| DELETE | `/api/configurations/:id` | Delete configuration |
| GET | `/api/bookings` | List user's bookings |
| POST | `/api/bookings` | Submit new booking |
| GET | `/api/bookings/:id` | Get booking details |
| PUT | `/api/bookings/:id` | Update booking |
| DELETE | `/api/bookings/:id` | Cancel booking |
| POST | `/api/bookings/:id/recurring` | Create recurring schedule |

### 7.5 Non-Functional Requirements

| Requirement | Specification |
|-------------|---------------|
| **Performance** | Page load < 3 seconds, map interaction < 100ms response |
| **Availability** | 99.5% uptime during business hours |
| **Scalability** | Support 500 concurrent users initially |
| **Security** | HTTPS only, password hashing (bcrypt), SQL injection prevention |
| **Browser Support** | Chrome, Firefox, Safari, Edge (latest 2 versions) |
| **Mobile** | Responsive design, functional on tablets (phone optimization later) |
| **Accessibility** | WCAG 2.1 AA compliance for core flows |

---

## 8. Soccer Field Specifications

### 8.1 FIFA Regulation Dimensions (11v11 Full Field)

| Element | Minimum | Maximum | Default (MVP) |
|---------|---------|---------|---------------|
| **Length (Touchline)** | 90m | 120m | 100m |
| **Width (Goal Line)** | 45m | 90m | 64m |

### 8.2 Interior Line Specifications

All interior elements are defined as proportions/offsets from the outer boundary:

| Element | Specification | Calculation Method |
|---------|---------------|-------------------|
| **Center Line** | Bisects field at midpoint | width / 2 from each goal line |
| **Center Circle** | 9.15m radius (fixed) | Fixed radius, positioned at field center |
| **Center Mark** | At field center | Intersection of center line and midpoint |
| **Penalty Area** | 16.5m from goal posts + 16.5m into field | Fixed 40.3m × 16.5m box |
| **Goal Area** | 5.5m from goal posts + 5.5m into field | Fixed 18.3m × 5.5m box |
| **Penalty Mark** | 11m from goal line center | Fixed distance from goal line |
| **Penalty Arc** | 9.15m radius from penalty mark | Arc outside penalty area |
| **Corner Arc** | 1m radius from corner | Quarter circle at each corner |
| **Goal Position** | Centered on goal line | 7.32m wide (fixed) |

### 8.3 Proportional Scaling Logic

When the user adjusts field dimensions, interior elements scale as follows:

**Fixed Elements (do not scale):**
- Center circle radius (9.15m)
- Penalty area dimensions (40.3m × 16.5m)
- Goal area dimensions (18.3m × 5.5m)
- Penalty mark distance (11m from goal line)
- Penalty arc radius (9.15m)
- Corner arc radius (1m)
- Goal width (7.32m)

**Scaled Elements:**
- Center line position (always at length / 2)
- All elements maintain their relative position from the goal line and touchlines

**Note:** For non-regulation field sizes (below minimum or above maximum), the system should:
1. Display a warning that dimensions are outside FIFA regulations
2. Still allow the configuration (many fields are non-standard)
3. Interior elements maintain their fixed sizes but reposition proportionally

### 8.4 Template Data Structure

```json
{
  "id": "soccer-11v11-full",
  "sport": "soccer",
  "name": "11v11 Full Field",
  "description": "Standard FIFA regulation soccer field for full-sided matches",
  "dimensions": {
    "length": { "min": 90, "max": 120, "default": 100, "unit": "meters" },
    "width": { "min": 45, "max": 90, "default": 64, "unit": "meters" }
  },
  "elements": [
    {
      "id": "outer_boundary",
      "type": "rectangle",
      "description": "Outer field boundary",
      "position": { "x": 0, "y": 0 },
      "size": { "width": "field_width", "height": "field_length" }
    },
    {
      "id": "center_line",
      "type": "line",
      "description": "Halfway line",
      "start": { "x": 0, "y": "field_length / 2" },
      "end": { "x": "field_width", "y": "field_length / 2" }
    },
    {
      "id": "center_circle",
      "type": "circle",
      "description": "Center circle",
      "center": { "x": "field_width / 2", "y": "field_length / 2" },
      "radius": 9.15,
      "radius_unit": "meters_fixed"
    },
    {
      "id": "center_mark",
      "type": "point",
      "description": "Center spot",
      "position": { "x": "field_width / 2", "y": "field_length / 2" },
      "radius": 0.22
    },
    {
      "id": "penalty_area_top",
      "type": "rectangle",
      "description": "Penalty area (top)",
      "position": { "x": "(field_width - 40.3) / 2", "y": 0 },
      "size": { "width": 40.3, "height": 16.5 },
      "size_unit": "meters_fixed"
    },
    {
      "id": "penalty_area_bottom",
      "type": "rectangle",
      "description": "Penalty area (bottom)",
      "position": { "x": "(field_width - 40.3) / 2", "y": "field_length - 16.5" },
      "size": { "width": 40.3, "height": 16.5 },
      "size_unit": "meters_fixed"
    },
    {
      "id": "goal_area_top",
      "type": "rectangle",
      "description": "Goal area (top)",
      "position": { "x": "(field_width - 18.3) / 2", "y": 0 },
      "size": { "width": 18.3, "height": 5.5 },
      "size_unit": "meters_fixed"
    },
    {
      "id": "goal_area_bottom",
      "type": "rectangle",
      "description": "Goal area (bottom)",
      "position": { "x": "(field_width - 18.3) / 2", "y": "field_length - 5.5" },
      "size": { "width": 18.3, "height": 5.5 },
      "size_unit": "meters_fixed"
    },
    {
      "id": "penalty_mark_top",
      "type": "point",
      "description": "Penalty spot (top)",
      "position": { "x": "field_width / 2", "y": 11 },
      "radius": 0.22
    },
    {
      "id": "penalty_mark_bottom",
      "type": "point",
      "description": "Penalty spot (bottom)",
      "position": { "x": "field_width / 2", "y": "field_length - 11" },
      "radius": 0.22
    },
    {
      "id": "penalty_arc_top",
      "type": "arc",
      "description": "Penalty arc (top)",
      "center": { "x": "field_width / 2", "y": 11 },
      "radius": 9.15,
      "start_angle": 37,
      "end_angle": 143
    },
    {
      "id": "penalty_arc_bottom",
      "type": "arc",
      "description": "Penalty arc (bottom)",
      "center": { "x": "field_width / 2", "y": "field_length - 11" },
      "radius": 9.15,
      "start_angle": 217,
      "end_angle": 323
    },
    {
      "id": "corner_arc_tl",
      "type": "arc",
      "description": "Corner arc (top-left)",
      "center": { "x": 0, "y": 0 },
      "radius": 1,
      "quadrant": "bottom-right"
    },
    {
      "id": "corner_arc_tr",
      "type": "arc",
      "description": "Corner arc (top-right)",
      "center": { "x": "field_width", "y": 0 },
      "radius": 1,
      "quadrant": "bottom-left"
    },
    {
      "id": "corner_arc_bl",
      "type": "arc",
      "description": "Corner arc (bottom-left)",
      "center": { "x": 0, "y": "field_length" },
      "radius": 1,
      "quadrant": "top-right"
    },
    {
      "id": "corner_arc_br",
      "type": "arc",
      "description": "Corner arc (bottom-right)",
      "center": { "x": "field_width", "y": "field_length" },
      "radius": 1,
      "quadrant": "top-left"
    }
  ]
}
```

---

## 9. MVP Scope

### 9.1 In Scope (Must Have)

| Category | Features |
|----------|----------|
| **Authentication** | Registration, login, logout, password reset, email verification |
| **Profile** | View/edit basic profile information |
| **Sportsgrounds** | Search, view satellite imagery, save to profile, list saved grounds |
| **Templates** | Soccer 11v11 full field template only |
| **Field Editor** | Place template, rotate, resize (proportional), manual dimension input |
| **Line Color** | Select from predefined colors, preview on field |
| **Configurations** | Save, load, edit, delete field configurations |
| **Booking** | Submit one-time booking request with date/time preference |
| **Notifications** | Email confirmation to customer, email notification to provider |

### 9.2 Out of Scope (Future Phases)

| Category | Features |
|----------|----------|
| **Templates** | 9v9, 7v7, 4v4 soccer; Rugby, NRL, AFL templates |
| **Multi-field** | Multiple overlapping fields on same ground |
| **Recurring** | Recurring booking schedules |
| **Admin Panel** | Full provider dashboard with job management |
| **Payments** | Online quoting and payment processing |
| **Mobile App** | Native iOS/Android applications |
| **Reports** | Customer and provider reporting dashboards |
| **Multi-tenant** | Support for multiple line marking providers |
| **API** | Public API for third-party integrations |

### 9.3 MVP User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER JOURNEY                             │
└─────────────────────────────────────────────────────────────────┘

[Landing Page]
      │
      ▼
[Sign Up / Login] ──────────────────────────────────────┐
      │                                                  │
      ▼                                                  │
[Dashboard]                                              │
      │                                                  │
      ├──► [Add Sportsground]                           │
      │         │                                        │
      │         ▼                                        │
      │    [Search Location]                            │
      │         │                                        │
      │         ▼                                        │
      │    [View Satellite Map]                         │
      │         │                                        │
      │         ▼                                        │
      │    [Save to Profile]                            │
      │         │                                        │
      │         ▼                                        │
      │    [Select Field Template]                      │
      │         │                                        │
      │         ▼                                        │
      │    [Position on Map]                            │
      │         │                                        │
      │         ▼                                        │
      │    [Adjust Size/Rotation]                       │
      │         │                                        │
      │         ▼                                        │
      │    [Choose Line Color]                          │
      │         │                                        │
      │         ▼                                        │
      │    [Save Configuration]                         │
      │         │                                        │
      │         ▼                                        │
      │    [Request Booking]                            │
      │         │                                        │
      │         ▼                                        │
      │    [Select Date/Time]                           │
      │         │                                        │
      │         ▼                                        │
      │    [Add Notes]                                  │
      │         │                                        │
      │         ▼                                        │
      │    [Submit Request]                             │
      │         │                                        │
      │         ▼                                        │
      │    [Confirmation]                               │
      │                                                  │
      ├──► [View Saved Configurations]                  │
      │         │                                        │
      │         ▼                                        │
      │    [Select Configuration]                       │
      │         │                                        │
      │         ▼                                        │
      │    [Quick Re-order] ─────────────────────────────┘
      │
      └──► [View Booking History]
```

---

## 10. User Interface & Experience

### 10.1 Key Screens

**1. Landing Page**
- Hero section with value proposition
- Key features overview
- CTA: "Get Started" / "Login"
- Example field preview (static image)

**2. Registration/Login**
- Clean form-based design
- Social login (optional, future)
- Password strength indicator
- Email verification flow

**3. Dashboard**
- Welcome message with user name
- Quick actions: "Add Sportsground", "View Configurations"
- Recent activity feed
- Saved sportsgrounds list (cards)
- Pending bookings summary

**4. Map/Editor View**
- Full-width satellite map
- Collapsible left panel:
  - Search bar (top)
  - Sportsground info
  - Template selector
  - Dimension inputs
  - Color selector
  - Save/Book buttons
- Field overlay on map with:
  - Rotation handle
  - Resize handles
  - Dimension labels
- Top toolbar:
  - Undo/Redo
  - Reset view
  - Help/Guide

**5. Booking Modal**
- Configuration summary
- Date picker (calendar)
- Time preference selector
- Notes text area
- Submit/Cancel buttons
- Loading state during submission

**6. Confirmation Page**
- Success message with checkmark
- Booking reference number
- Summary of details
- "View All Bookings" CTA
- "Create Another" CTA

### 10.2 Design Principles

| Principle | Application |
|-----------|-------------|
| **Clarity** | Clear labels, obvious actions, minimal jargon |
| **Feedback** | Loading states, success/error messages, hover effects |
| **Efficiency** | Minimal clicks to complete core tasks |
| **Forgiveness** | Undo capability, confirmation dialogs for destructive actions |
| **Consistency** | Uniform styling, predictable navigation patterns |

### 10.3 Responsive Considerations

| Breakpoint | Behavior |
|------------|----------|
| **Desktop (1200px+)** | Full side panel, large map area |
| **Tablet (768-1199px)** | Collapsible panel, touch-friendly handles |
| **Mobile (< 768px)** | Stacked layout, bottom sheet panels (limited editing) |

**Note:** Full field editing on mobile phones is challenging due to precision requirements. MVP will focus on desktop/tablet with mobile-optimized viewing and basic interaction.

---

## 11. Future Phases

### Phase 2: Additional Soccer Templates
- 9v9 field template
- 7v7 field template
- 4v4 field template
- Small-sided game templates
- Training grid templates

### Phase 3: Multi-Sport Expansion
- Rugby Union field template
- Rugby League (NRL) field template
- AFL oval template
- Touch Football template
- Hockey field template

### Phase 4: Advanced Features
- Multiple fields on single ground (overlay management)
- Recurring booking schedules
- Automated scheduling suggestions
- Weather integration for booking optimization

### Phase 5: Business Operations
- Provider admin dashboard
- Job scheduling and assignment
- Crew mobile app
- Route optimization
- Inventory/material tracking

### Phase 6: Commercial Features
- Instant quoting engine
- Online payment processing
- Subscription plans for frequent customers
- Automated invoicing
- Financial reporting

### Phase 7: Platform Expansion
- Multi-tenant support (multiple providers)
- Provider marketplace
- Customer reviews and ratings
- API for third-party integrations
- Native mobile applications

---

## 12. Success Metrics

### 12.1 MVP Success Criteria

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **User Registrations** | 50 users in first 3 months | Database count |
| **Active Users** | 30% monthly active rate | Login tracking |
| **Configurations Saved** | 100 configurations | Database count |
| **Bookings Submitted** | 50 bookings | Database count |
| **Conversion Rate** | 20% of registrations submit a booking | Calculated |
| **User Satisfaction** | 4+ star rating (out of 5) | Post-booking survey |
| **Task Completion** | 80% of users can complete core flow unaided | User testing |
| **Time to Book** | < 10 minutes for first-time user | Session analytics |

### 12.2 Key Performance Indicators (Ongoing)

| KPI | Description | Target |
|-----|-------------|--------|
| **Customer Acquisition Cost** | Marketing spend / new customers | < $50 |
| **Booking Accuracy** | Jobs completed without field errors | > 95% |
| **Repeat Booking Rate** | % of customers who book again | > 60% |
| **Net Promoter Score** | Would recommend to colleague | > 40 |
| **Support Ticket Volume** | Issues per 100 bookings | < 5 |

---

## 13. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Satellite imagery quality varies** | High | Medium | Use best available provider; allow manual adjustment; show imagery date |
| **Users struggle with field manipulation** | Medium | High | In-app tutorial; simple controls; clear visual feedback; help documentation |
| **Mapping API costs escalate** | Medium | Medium | Monitor usage; implement caching; set usage alerts; budget reserves |
| **Email deliverability issues** | Low | High | Use reputable email provider; monitor bounce rates; fallback notifications |
| **User adoption slower than expected** | Medium | Medium | Gather early feedback; iterate on UX; direct outreach to existing customers |
| **Technical complexity of canvas/map integration** | Medium | High | Prototype early; choose proven libraries; allow extra development time |
| **Non-standard field sizes confuse users** | Medium | Low | Clear warnings; educational content; still allow flexibility |
| **Competition launches similar product** | Low | Medium | Focus on UX and customer relationships; differentiate on service quality |

---

## 14. Appendix

### 14.1 Glossary

| Term | Definition |
|------|------------|
| **Configuration** | A saved field design including template, dimensions, color, and position |
| **Goal Line** | The shorter boundary line at each end of the field (determines field width) |
| **Penalty Arc** | The curved line outside the penalty area, 9.15m from the penalty spot |
| **Penalty Area** | The larger box at each end of the field (16.5m × 40.3m) |
| **Goal Area** | The smaller box inside the penalty area (5.5m × 18.3m) |
| **Sportsground** | A physical location where sports are played, may contain multiple fields |
| **Template** | A predefined field layout with standard dimensions and markings |
| **Touchline** | The longer boundary line on each side of the field (determines field length) |

### 14.2 Reference Documents

- FIFA Laws of the Game (Field Markings): https://www.theifab.com/laws
- World Rugby Laws (Field Dimensions): https://laws.worldrugby.org
- AFL Laws (Oval Specifications): https://www.afl.com.au/laws

### 14.3 Competitive Analysis Summary

| Competitor | Strengths | Weaknesses | Opportunity |
|------------|-----------|------------|-------------|
| **Manual Process** | Personal relationships | Time-consuming, error-prone | Automate while maintaining service |
| **Generic Booking Apps** | Broad functionality | Not sports-specific | Specialized features |
| **CAD Software** | Precise design | Steep learning curve, expensive | Simple, accessible design |

### 14.4 Future Template Specifications (Reference)

**Soccer 9v9**
- Dimensions: 60-70m × 40-50m
- Modified penalty area: 12m × 28m
- No penalty arc
- Center circle: 7m radius

**Soccer 7v7**
- Dimensions: 50-60m × 35-45m
- Penalty area: 10m × 24m
- Center circle: 6m radius

**Soccer 4v4**
- Dimensions: 30-40m × 20-30m
- No penalty areas (small goal boxes only)
- Center circle: 4m radius

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | December 11, 2025 | Product Team | Initial draft |

---

**Next Steps:**
1. Review PRD with stakeholders
2. Technical feasibility assessment
3. UI/UX wireframe development
4. Development sprint planning
5. Beta customer recruitment

# LaunchNest — Supabase Database Integration

This directory contains the database migration files, schemas, and demo seed files for the **LaunchNest** application. The database is hosted on **Supabase** (powered by PostgreSQL).

## Database Tables

The database is structured into 9 tables:

1. **`profiles`**: Stores user account details and matches users with roles (`student`, `mentor`, `developer`, `admin`).
2. **`ideas`**: Stores private and public student startup ideas, descriptions, stage details, pitch deck links, and cryptographic SHA-256 hashes.
3. **`blockchain_records`**: Maintains the record of hash registration on the Cardano blockchain, including Tx hash, block heights, and network configurations.
4. **`milestones`**: Manages the development roadmap milestones for each startup.
5. **`team_members`**: Maps project founders and developers together.
6. **`mentor_feedback`**: Logs reviews, feedback, and startup-readiness scores (1-5) left by mentors.
7. **`mentorship_requests`**: Handles students requesting mentors to guide their projects.
8. **`developer_applications`**: Manages developers applying to join student startup teams.
9. **`notifications`**: Dispatches live updates about milestones, blockchain transactions, and applications.

---

## Row-Level Security (RLS) Policies

To protect proprietary student startup ideas, we enforce strict Row-Level Security (RLS) constraints:
- **Profiles**: Public profiles are read-only to anyone. Users can edit only their own profile details.
- **Ideas**: 
  - Anyone can view ideas marked as `public`.
  - Ideas marked as `private` are visible only to the owner (`owner_id = auth.uid()`), team members joined to the startup, or assigned mentors.
  - Students can only insert/edit ideas where they are designated as the owner.
  - Admins retain query permissions to review all ideas.
- **Developer Applications / Mentorship**: Visible only to the applicant, the startup founder, and admins.
- **Notifications**: Users can read/write only their own notifications.

---

## How to Set Up Supabase Locally or on Cloud

### 1. Initialize Supabase CLI (Optional)
If running a local Supabase stack:
```bash
supabase init
```

### 2. Apply Migrations
Apply the initial table schemas and RLS security policies:
```bash
# For local Supabase
supabase db reset

# Or apply directly in the Supabase SQL Editor:
# Copy the contents of migrations/20260712000000_init.sql and run it.
```

### 3. Apply Seed Data
Pre-populate the database with the required mock users, startup ideas, milestones, applications, and feedback for demo verification:
```bash
# For local Supabase
supabase db reset --use-seed

# Or copy the contents of seed.sql and run it in the Supabase SQL Editor.
```

## Seed User Credentials
The database contains pre-configured users for demo testing (see root project `README.md` for specific credentials).

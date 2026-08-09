-- LaunchNest Supabase Database Migration
-- Target: Supabase PostgreSQL (Postgres 15+)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Profiles Table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('student', 'mentor', 'developer', 'admin')),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Create Ideas Table
CREATE TABLE IF NOT EXISTS public.ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  short_description TEXT NOT NULL,
  category TEXT NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN ('Concept', 'Prototype', 'MVP', 'Growth')),
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
  problem_statement TEXT NOT NULL,
  proposed_solution TEXT NOT NULL,
  target_users TEXT NOT NULL,
  unique_value TEXT NOT NULL,
  expected_impact TEXT NOT NULL,
  revenue_model TEXT NOT NULL,
  market_opportunity TEXT NOT NULL,
  competitors TEXT NOT NULL,
  required_team_members TEXT NOT NULL,
  required_mentor_expertise TEXT NOT NULL,
  pitch_deck_url TEXT,
  prototype_url TEXT,
  github_repo_url TEXT,
  supporting_docs_url TEXT,
  canonical_payload JSONB NOT NULL,
  idea_hash TEXT NOT NULL,
  blockchain_status TEXT NOT NULL DEFAULT 'Pending' CHECK (blockchain_status IN ('Pending', 'Submitted', 'Confirmed', 'Failed', 'Demo')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on Ideas
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;

-- 3. Create Blockchain Records Table
CREATE TABLE IF NOT EXISTS public.blockchain_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  idea_hash TEXT NOT NULL,
  canonical_payload_version TEXT NOT NULL DEFAULT '1.0',
  transaction_hash TEXT NOT NULL UNIQUE,
  script_address TEXT NOT NULL,
  output_index INTEGER NOT NULL DEFAULT 0,
  utxo_reference TEXT NOT NULL,
  network TEXT NOT NULL DEFAULT 'preview',
  metadata_label BIGINT DEFAULT 674 NOT NULL,
  block_height BIGINT,
  confirmation_status TEXT NOT NULL DEFAULT 'Pending' CHECK (confirmation_status IN ('Pending', 'Confirmed', 'Failed', 'Demo')),
  registered_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on Blockchain Records
ALTER TABLE public.blockchain_records ENABLE ROW LEVEL SECURITY;

-- 4. Create Milestones Table
CREATE TABLE IF NOT EXISTS public.milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  due_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Approved')),
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on Milestones
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

-- 5. Create Team Members Table
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_in_team TEXT NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(idea_id, user_id)
);

-- Enable RLS on Team Members
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- 6. Create Mentor Feedback Table
CREATE TABLE IF NOT EXISTS public.mentor_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  feedback_text TEXT NOT NULL,
  rating_readiness INTEGER CHECK (rating_readiness >= 1 AND rating_readiness <= 5) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on Mentor Feedback
ALTER TABLE public.mentor_feedback ENABLE ROW LEVEL SECURITY;

-- 7. Create Mentorship Requests Table
CREATE TABLE IF NOT EXISTS public.mentorship_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted', 'Rejected')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on Mentorship Requests
ALTER TABLE public.mentorship_requests ENABLE ROW LEVEL SECURITY;

-- 8. Create Developer Applications Table
CREATE TABLE IF NOT EXISTS public.developer_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  developer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cover_letter TEXT,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted', 'Rejected')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on Developer Applications
ALTER TABLE public.developer_applications ENABLE ROW LEVEL SECURITY;

-- 9. Create Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  type TEXT NOT NULL CHECK (type IN ('application', 'feedback', 'milestone', 'blockchain', 'team')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;


-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Ideas Policies
CREATE POLICY "Public ideas are viewable by everyone" ON public.ideas
  FOR SELECT USING (visibility = 'public');

CREATE POLICY "Users can view their own private ideas" ON public.ideas
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Mentors can view assigned ideas" ON public.ideas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.mentorship_requests 
      WHERE mentorship_requests.idea_id = ideas.id 
      AND mentorship_requests.mentor_id = auth.uid()
    )
  );

CREATE POLICY "Team members can view team ideas" ON public.ideas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members 
      WHERE team_members.idea_id = ideas.id 
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all ideas" ON public.ideas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Students can insert their own ideas" ON public.ideas
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their own ideas" ON public.ideas
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their own ideas" ON public.ideas
  FOR DELETE USING (auth.uid() = owner_id);

CREATE POLICY "Admins can update any idea" ON public.ideas
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Blockchain Records Policies
CREATE POLICY "Blockchain records are viewable by anyone" ON public.blockchain_records
  FOR SELECT USING (true);

CREATE POLICY "Idea owner can insert blockchain records" ON public.blockchain_records
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ideas 
      WHERE ideas.id = blockchain_records.idea_id AND ideas.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert/update blockchain records" ON public.blockchain_records
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Milestones Policies
CREATE POLICY "Milestones are viewable by associated users" ON public.milestones
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.ideas 
      WHERE ideas.id = milestones.idea_id AND (
        ideas.owner_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.team_members WHERE team_members.idea_id = ideas.id AND team_members.user_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.mentorship_requests WHERE mentorship_requests.idea_id = ideas.id AND mentorship_requests.mentor_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
      )
    )
  );

CREATE POLICY "Idea owners can manage milestones" ON public.milestones
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.ideas 
      WHERE ideas.id = milestones.idea_id AND ideas.owner_id = auth.uid()
    )
  );

CREATE POLICY "Mentors can update milestones to approve them" ON public.milestones
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.mentorship_requests 
      WHERE mentorship_requests.idea_id = milestones.idea_id 
      AND mentorship_requests.mentor_id = auth.uid()
    )
  );

-- Team Members Policies
CREATE POLICY "Team members are viewable by everyone" ON public.team_members
  FOR SELECT USING (true);

CREATE POLICY "Idea owners can manage team members" ON public.team_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.ideas 
      WHERE ideas.id = team_members.idea_id AND ideas.owner_id = auth.uid()
    )
  );

-- Mentor Feedback Policies
CREATE POLICY "Feedback is viewable by everyone" ON public.mentor_feedback
  FOR SELECT USING (true);

CREATE POLICY "Mentors can manage feedback" ON public.mentor_feedback
  FOR ALL USING (auth.uid() = mentor_id);

-- Mentorship Requests Policies
CREATE POLICY "Requests viewable by student, mentor, and admin" ON public.mentorship_requests
  FOR SELECT USING (
    auth.uid() = student_id OR auth.uid() = mentor_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Students can create mentorship requests" ON public.mentorship_requests
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Mentors and students can update requests" ON public.mentorship_requests
  FOR UPDATE USING (auth.uid() = student_id OR auth.uid() = mentor_id);

-- Developer Applications Policies
CREATE POLICY "Applications viewable by developer, owner, and admin" ON public.developer_applications
  FOR SELECT USING (
    auth.uid() = developer_id OR 
    EXISTS (SELECT 1 FROM public.ideas WHERE ideas.id = developer_applications.idea_id AND ideas.owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Developers can create applications" ON public.developer_applications
  FOR INSERT WITH CHECK (auth.uid() = developer_id);

CREATE POLICY "Owners can update applications" ON public.developer_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.ideas 
      WHERE ideas.id = developer_applications.idea_id AND ideas.owner_id = auth.uid()
    )
  );

-- Notifications Policies
CREATE POLICY "Users can manage their own notifications" ON public.notifications
  FOR ALL USING (auth.uid() = user_id);


-- =========================================================================
-- AUTH TRIGGERS
-- =========================================================================

-- Trigger to automatically create a Profile for new Auth Users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Student Founder'),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

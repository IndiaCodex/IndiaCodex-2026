-- LaunchNest Supabase Seed Data
-- Populates mock records for local testing and presentation

-- Clean existing records to prevent conflicts on execution
TRUNCATE public.notifications CASCADE;
TRUNCATE public.developer_applications CASCADE;
TRUNCATE public.mentorship_requests CASCADE;
TRUNCATE public.mentor_feedback CASCADE;
TRUNCATE public.team_members CASCADE;
TRUNCATE public.milestones CASCADE;
TRUNCATE public.blockchain_records CASCADE;
TRUNCATE public.ideas CASCADE;
TRUNCATE public.profiles CASCADE;

-- 1. Insert Profiles (Students, Mentors, Developers, Admins)
-- Student Profiles
INSERT INTO public.profiles (id, role, full_name, email, avatar_url, bio) VALUES
('11111111-1111-1111-1111-111111111111', 'student', 'Rohan Sharma', 'rohan@launchnest.dev', 'https://api.dicebear.com/7.x/adventurer/svg?seed=Rohan', 'CS Senior at IIT Delhi. Passionate about Web3 and decentralization.'),
('11111111-1111-1111-1111-222222222222', 'student', 'Priya Patel', 'priya@launchnest.dev', 'https://api.dicebear.com/7.x/adventurer/svg?seed=Priya', 'Pre-final year IT student at BITS Pilani. Climate tech enthusiast.'),
('11111111-1111-1111-1111-333333333333', 'student', 'Amit Verma', 'amit@launchnest.dev', 'https://api.dicebear.com/7.x/adventurer/svg?seed=Amit', 'Bioinformatics major at VIT. Building at the intersection of healthcare and blockchain.'),
('11111111-1111-1111-1111-444444444444', 'student', 'Sneha Reddy', 'sneha@launchnest.dev', 'https://api.dicebear.com/7.x/adventurer/svg?seed=Sneha', 'Economics and Finance student at SRCC. Exploring DeFi models for rural lending.'),
('11111111-1111-1111-1111-555555555555', 'student', 'Vikram Singh', 'vikram@launchnest.dev', 'https://api.dicebear.com/7.x/adventurer/svg?seed=Vikram', 'Software engineering student at DTU. Passionate about P2P networks.');

-- Mentor Profiles
INSERT INTO public.profiles (id, role, full_name, email, avatar_url, bio, github_url, portfolio_url) VALUES
('22222222-2222-2222-2222-111111111111', 'mentor', 'Dr. Aris Thorne', 'aris@launchnest.dev', 'https://api.dicebear.com/7.x/bottts/svg?seed=Aris', 'Professor of Cryptography and Cardano smart contract developer. Ex-IOHK researcher.', 'https://github.com/aris-thorne', 'https://aris.dev'),
('22222222-2222-2222-2222-222222222222', 'mentor', 'Sunita Rao', 'sunita@launchnest.dev', 'https://api.dicebear.com/7.x/bottts/svg?seed=Sunita', 'General Partner at Aether Ventures. Mentoring student startups for 8+ years.', NULL, 'https://aether.vc'),
('22222222-2222-2222-2222-333333333333', 'mentor', 'Charles Hoskinson', 'charles@launchnest.dev', 'https://api.dicebear.com/7.x/bottts/svg?seed=Charles', 'Founder of Cardano & CEO of Input Output Global. Promoting open-source decentralization in India.', 'https://github.com/input-output-hk', 'https://hoskinson.io'),
('22222222-2222-2222-2222-444444444444', 'mentor', 'Rajesh Kumar', 'rajesh@launchnest.dev', 'https://api.dicebear.com/7.x/bottts/svg?seed=Rajesh', 'SaaS founder and growth advisor. Helping startups scale from 0 to 1.', 'https://github.com/rajesh-saas', 'https://kumar.co');

-- Developer Profiles
INSERT INTO public.profiles (id, role, full_name, email, avatar_url, bio, github_url, portfolio_url) VALUES
('33333333-3333-3333-3333-111111111111', 'developer', 'Kabir Mehta', 'kabir@launchnest.dev', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kabir', 'React and Tailwind specialist. Love building fluid interactive dashboards.', 'https://github.com/kabir-mehta', 'https://kabir.me'),
('33333333-3333-3333-3333-222222222222', 'developer', 'Ananya Sen', 'ananya@launchnest.dev', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ananya', 'Cardano smart contract researcher and Haskeller. Transitioning into Aiken.', 'https://github.com/ananya-cardano', 'https://ananyasen.in'),
('33333333-3333-3333-3333-333333333333', 'developer', 'Tushar Gupta', 'tushar@launchnest.dev', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tushar', 'Full stack Next.js & Node.js developer. Experienced with databases.', 'https://github.com/tushar-g', 'https://tushar.codes'),
('33333333-3333-3333-3333-444444444444', 'developer', 'Meera Nair', 'meera@launchnest.dev', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Meera', 'UI/UX designer. Making complex blockchain apps look simple and beautiful.', NULL, 'https://behance.net/meera'),
('33333333-3333-3333-3333-555555555555', 'developer', 'Devansh Joshi', 'devansh@launchnest.dev', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Devansh', 'System level programmer learning smart contracts in Aiken and Rust.', 'https://github.com/devansh-j', NULL),
('33333333-3333-3333-3333-666666666666', 'developer', 'Aisha Khan', 'aisha@launchnest.dev', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aisha', 'Database administrator and API architect. Devops explorer.', 'https://github.com/aisha-k', 'https://aisha.dev');

-- Admin Profile
INSERT INTO public.profiles (id, role, full_name, email, avatar_url, bio) VALUES
('44444444-4444-4444-4444-111111111111', 'admin', 'LaunchNest Admin', 'admin@launchnest.dev', 'https://api.dicebear.com/7.x/identicon/svg?seed=Admin', 'LaunchNest Admin Dashboard Account.');


-- 2. Insert Startup Ideas
-- Idea 1: EduBlocks (Rohan Sharma)
INSERT INTO public.ideas (id, owner_id, title, short_description, category, stage, visibility, problem_statement, proposed_solution, target_users, unique_value, expected_impact, revenue_model, market_opportunity, competitors, required_team_members, required_mentor_expertise, pitch_deck_url, prototype_url, github_repo_url, canonical_payload, idea_hash, blockchain_status) VALUES
('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 
 'EduBlocks', 'A decentralized credential registry on Cardano to prevent certificate fraud.', 'EdTech / Web3', 'Concept', 'public',
 'University credential and certificate fraud is rising globally, making verifying documents slow and expensive.',
 'Create tamper-proof blockchain certificates issued by universities via Cardano smart contracts.',
 'Universities, students, recruiters, and screening agencies.',
 'Low transaction cost, instant cryptographic validation, zero reliance on a centralized verification database.',
 'Reduce recruitment screening times from 2 weeks to 2 seconds and fully eliminate certificate counterfeiting.',
 'B2B subscription fee for universities per credential issued.',
 'Global background verification market valued at $5B+ annually.',
 'Accredible, Parchment, local verification agencies.',
 'Full Stack Developer, UX Designer', 'Smart Contract Development, Higher Ed Partnerships',
 'https://docs.google.com/presentation/d/edublocks', 'https://edublocks.vercel.app', 'https://github.com/launchnest/edublocks',
 '{"title": "EduBlocks", "owner_id": "11111111-1111-1111-1111-111111111111", "submitted_at": 1718192000, "target_users": "Universities, students, recruiters, and screening agencies.", "problem_statement": "University credential and certificate fraud is rising globally, making verifying documents slow and expensive.", "proposed_solution": "Create tamper-proof blockchain certificates issued by universities via Cardano smart contracts.", "short_description": "A decentralized credential registry on Cardano to prevent certificate fraud."}',
 '1a46b5a34f8a8461ee6b6ee2b7c6cb34ea72a8c3d6c1b3f7f85885a06900ee9c', 'Confirmed');

-- Idea 2: GreenTrace (Priya Patel)
INSERT INTO public.ideas (id, owner_id, title, short_description, category, stage, visibility, problem_statement, proposed_solution, target_users, unique_value, expected_impact, revenue_model, market_opportunity, competitors, required_team_members, required_mentor_expertise, pitch_deck_url, prototype_url, github_repo_url, canonical_payload, idea_hash, blockchain_status) VALUES
('a0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-222222222222', 
 'GreenTrace', 'Supply chain transparency for carbon offset validation.', 'Sustainability / IoT', 'Prototype', 'public',
 'Carbon offset credits are double-counted and lack verified tracking, leading to greenwashing.',
 'Use IoT sensors and Cardano smart contracts to record live carbon offset logs directly to the ledger.',
 'Corporate sustainability departments, ESG audit firms, offset providers.',
 'Live hardware audit integration, tamper-proof Cardano ledger data.',
 'Increase investor trust in carbon offset projects by 90% and prevent tokenized asset double-counting.',
 'SaaS audit fees and transaction commissions on carbon credit sales.',
 'Voluntary carbon offset market projected to reach $10B+ by 2030.',
 'Verra, Gold Standard, Toucan Protocol.',
 'IoT Firmware Engineer, Solidity/Aiken Dev', 'Carbon Accounting Standards, IoT Systems Integration',
 'https://docs.google.com/presentation/d/greentrace', 'https://greentrace.io', 'https://github.com/launchnest/greentrace',
 '{"title": "GreenTrace", "owner_id": "11111111-1111-1111-1111-222222222222", "submitted_at": 1718193000, "target_users": "Corporate sustainability departments, ESG audit firms, offset providers.", "problem_statement": "Carbon offset credits are double-counted and lack verified tracking, leading to greenwashing.", "proposed_solution": "Use IoT sensors and Cardano smart contracts to record live carbon offset logs directly to the ledger.", "short_description": "Supply chain transparency for carbon offset validation."}',
 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'Confirmed');

-- Idea 3: HealSync (Amit Verma)
INSERT INTO public.ideas (id, owner_id, title, short_description, category, stage, visibility, problem_statement, proposed_solution, target_users, unique_value, expected_impact, revenue_model, market_opportunity, competitors, required_team_members, required_mentor_expertise, pitch_deck_url, prototype_url, github_repo_url, canonical_payload, idea_hash, blockchain_status) VALUES
('a0000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-333333333333', 
 'HealSync', 'Secure medical records transfer using zero-knowledge proofs and Cardano.', 'Healthcare / Security', 'MVP', 'public',
 'Patient medical records are fragmented, and sharing them insecurely risks HIPAA compliance violations.',
 'Implement ZK-proofs to prove eligibility and treatment history without exposing private patient data.',
 'Hospitals, insurance companies, patients.',
 'Ultimate privacy compliance, student founder access to health records database, high security.',
 'Zero patient leakages, patient controls own data permissions on Cardano ledger.',
 'API integration fee per query for health insurers.',
 'Digital health market size is $200B+ globally.',
 'Epic Systems, local electronic health record networks.',
 'Rust Dev, ZK Cryptographer', 'HIPAA Regulations, Healthcare API Integration',
 'https://docs.google.com/presentation/d/healsync', 'https://healsync.org', 'https://github.com/launchnest/healsync',
 '{"title": "HealSync", "owner_id": "11111111-1111-1111-1111-333333333333", "submitted_at": 1718194000, "target_users": "Hospitals, insurance companies, patients.", "problem_statement": "Patient medical records are fragmented, and sharing them insecurely risks HIPAA compliance violations.", "proposed_solution": "Implement ZK-proofs to prove eligibility and treatment history without exposing private patient data.", "short_description": "Secure medical records transfer using zero-knowledge proofs and Cardano."}',
 '1b020a597fc0e29bca598d1a1b181a4a4b2a8d3e69182390f7a0c8ef2882a8bf', 'Pending');

-- Idea 4: FarmLedger (Sneha Reddy)
INSERT INTO public.ideas (id, owner_id, title, short_description, category, stage, visibility, problem_statement, proposed_solution, target_users, unique_value, expected_impact, revenue_model, market_opportunity, competitors, required_team_members, required_mentor_expertise, pitch_deck_url, prototype_url, github_repo_url, canonical_payload, idea_hash, blockchain_status) VALUES
('a0000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-444444444444', 
 'FarmLedger', 'Microlending platform for rural Indian farmers using Cardano smart contracts.', 'AgriTech / DeFi', 'Concept', 'public',
 'Smallholder farmers in rural India cannot access credit from formal banks due to lack of collateral.',
 'Create micro-lending pools funded globally, disbursed as ADA/stablecoins, and secured via smart contract escrow.',
 'Rural farmers, global micro-lenders, local credit unions.',
 'High interest yields for lenders, low administration overhead for farmers, decentralized reputation scoring.',
 'Reduce interest rates for smallholder farmers from 36% (local lenders) to under 8% per annum.',
 '1% service charge on loan volume payouts.',
 'Agri-credit demand in India exceeds $150B annually.',
 'Kiva, Rang De, local microfinance banks.',
 'Mobile App Developer, Agri-Economist', 'Rural Credit Systems, Local Compliance & Regulatory',
 'https://docs.google.com/presentation/d/farmledger', NULL, 'https://github.com/launchnest/farmledger',
 '{"title": "FarmLedger", "owner_id": "11111111-1111-1111-1111-444444444444", "submitted_at": 1718195000, "target_users": "Rural farmers, global micro-lenders, local credit unions.", "problem_statement": "Smallholder farmers in rural India cannot access credit from formal banks due to lack of collateral.", "proposed_solution": "Create micro-lending pools funded globally, disbursed as ADA/stablecoins, and secured via smart contract escrow.", "short_description": "Microlending platform for rural Indian farmers using Cardano smart contracts."}',
 '2c040d867ac0e59eca598d1a1b181a4a4b2a8d3e69182390f7a0c8ef2882b9cf', 'Demo');

-- Idea 5: BazaarDAO (Vikram Singh)
INSERT INTO public.ideas (id, owner_id, title, short_description, category, stage, visibility, problem_statement, proposed_solution, target_users, unique_value, expected_impact, revenue_model, market_opportunity, competitors, required_team_members, required_mentor_expertise, pitch_deck_url, prototype_url, github_repo_url, canonical_payload, idea_hash, blockchain_status) VALUES
('a0000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-555555555555', 
 'BazaarDAO', 'Decentralized local e-commerce with peer-to-peer micro-escrows.', 'E-Commerce / Logistics', 'Concept', 'private',
 'Centralized e-commerce platforms charge heavy commission fees (15-30%) and delay merchant payouts.',
 'A peer-to-peer marketplace that uses Cardano smart contracts to escrow payments until delivery is verified.',
 'Local merchants, freelance delivery riders, neighborhood consumers.',
 '0% marketplace fees, instant payouts upon successful proof-of-delivery.',
 'Cut merchant marketing and distribution costs, saving small businesses up to 25% on revenues.',
 'Small protocol-level transaction fees for arbitration services.',
 'Quick-commerce market in India is expanding at 40% YoY.',
 'ONDC, Swiggy Instamart, Dunzo.',
 'Arbitration UI builder, Solidity Dev', 'P2P Escrows, Dispute Resolution Protocols',
 NULL, NULL, NULL,
 '{"title": "BazaarDAO", "owner_id": "11111111-1111-1111-1111-555555555555", "submitted_at": 1718196000, "target_users": "Local merchants, freelance delivery riders, neighborhood consumers.", "problem_statement": "Centralized e-commerce platforms charge heavy commission fees (15-30%) and delay merchant payouts.", "proposed_solution": "A peer-to-peer marketplace that uses Cardano smart contracts to escrow payments until delivery is verified.", "short_description": "Decentralized local e-commerce with peer-to-peer micro-escrows."}',
 '5b040e867ac0e59eca598d1a1b181a4a4b2a8d3e69182390f7a0c8ef2882c9df', 'Pending');


-- 3. Insert Blockchain Records
-- For Idea 1: EduBlocks (Real Cardano Tx Concept)
INSERT INTO public.blockchain_records (id, idea_id, idea_hash, transaction_hash, script_address, output_index, utxo_reference, network, block_height, confirmation_status, registered_at) VALUES
('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
 '1a46b5a34f8a8461ee6b6ee2b7c6cb34ea72a8c3d6c1b3f7f85885a06900ee9c',
 '4a0f443b7bc902c67ef1ad499cc8742b781da268598125191c9588665fca2219',
 'addr_test1wzdm6f183dbfa91461fffae3b60dc1d4a5c531d044fde1851275bb25',
 0, '4a0f443b7bc902c67ef1ad499cc8742b781da268598125191c9588665fca2219#0',
 'preview', 412588, 'Confirmed', '2026-07-10T14:30:00Z');

-- For Idea 2: GreenTrace (Real Cardano Tx Concept)
INSERT INTO public.blockchain_records (id, idea_id, idea_hash, transaction_hash, script_address, output_index, utxo_reference, network, block_height, confirmation_status, registered_at) VALUES
('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002',
 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
 '8b8f2c3d5e23910cd6cde7a1b181a4a4b2a8d3e69182390f7a0c8ef2882a8bfb',
 'addr_test1wzdm6f183dbfa91461fffae3b60dc1d4a5c531d044fde1851275bb25',
 0, '8b8f2c3d5e23910cd6cde7a1b181a4a4b2a8d3e69182390f7a0c8ef2882a8bfb#0',
 'preview', 413204, 'Confirmed', '2026-07-11T09:15:00Z');

-- For Idea 4: FarmLedger (Demo Mode)
INSERT INTO public.blockchain_records (id, idea_id, idea_hash, transaction_hash, script_address, output_index, utxo_reference, network, block_height, confirmation_status, registered_at) VALUES
('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004',
 '2c040d867ac0e59eca598d1a1b181a4a4b2a8d3e69182390f7a0c8ef2882b9cf',
 'demo_72a445ffce902b6de1a4cb90bfd8d672f10b8ea79cc2b7c6cb34ea72a8c3d6ff',
 'addr_test1wzdm6f183dbfa91461fffae3b60dc1d4a5c531d044fde1851275bb25',
 0, 'demo_72a445ffce902b6de1a4cb90bfd8d672f10b8ea79cc2b7c6cb34ea72a8c3d6ff#0',
 'preview', 414112, 'Demo', '2026-07-12T10:00:00Z');


-- 4. Insert Milestones
-- Milestones for EduBlocks
INSERT INTO public.milestones (id, idea_id, title, description, status, due_date) VALUES
('d0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'Finalize Smart Contract Code', 'Write and compile Aiken code for credential registries.', 'Approved', '2026-07-05T00:00:00Z'),
('d0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'Build Verification Portal', 'Create the front-end dashboard allowing recruiters to search hashes.', 'In Progress', '2026-07-20T00:00:00Z'),
('d0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000001', 'Integrate Mesh SDK Wallet', 'Deploy backend signing infrastructure and plug in Nami browser wallet.', 'Pending', '2026-08-10T00:00:00Z');

-- Milestones for GreenTrace
INSERT INTO public.milestones (id, idea_id, title, description, status, due_date) VALUES
('d0000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000002', 'IoT Firmware Development', 'Connect ESP32 carbon output monitor to send data packages.', 'Approved', '2026-06-30T00:00:00Z'),
('d0000000-0000-0000-0000-000000000022', 'a0000000-0000-0000-0000-000000000002', 'Cardano Metadata Integration', 'Encode IoT logging payloads into metadata transactions under label 674.', 'Completed', '2026-07-10T00:00:00Z');


-- 5. Insert Team Members
-- Rohan Sharma (Student Founder) & Kabir Mehta (Front-end Dev) in EduBlocks team
INSERT INTO public.team_members (idea_id, user_id, role_in_team) VALUES
('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Founder & Project Manager'),
('a0000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-111111111111', 'Lead Front-end Developer');

-- Priya Patel & Ananya Sen in GreenTrace team
INSERT INTO public.team_members (idea_id, user_id, role_in_team) VALUES
('a0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-222222222222', 'Founder & Hardware Lead'),
('a0000000-0000-0000-0000-000000000002', '33333333-3333-3333-3333-222222222222', 'Cardano Plutus Specialist');


-- 6. Insert Mentor Feedback
-- Dr. Aris Thorne feedback on EduBlocks
INSERT INTO public.mentor_feedback (idea_id, mentor_id, feedback_text, rating_readiness) VALUES
('a0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-111111111111',
 'Great choice of validator design. The spend signature checks are extremely secure. Suggesting you test with pre-compiled plutus.json blueprints in the Next.js client for faster transaction building. The overall design looks very production-ready.', 5);

-- Sunita Rao feedback on FarmLedger
INSERT INTO public.mentor_feedback (idea_id, mentor_id, feedback_text, rating_readiness) VALUES
('a0000000-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222',
 'The business model is exciting. Connecting global capital directly to rural farmers using micro-escrows solves real funding bottlenecks. Make sure to double check local financial regulations regarding stablecoin distributions.', 4);


-- 7. Insert Mentorship Requests
-- Rohan Sharma requests Charles Hoskinson
INSERT INTO public.mentorship_requests (idea_id, student_id, mentor_id, message, status) VALUES
('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-333333333333', 
 'Hi Charles, we are building EduBlocks to solve credential fraud in India. We would love to get your advice on optimizing the on-chain storage cost for scaling to millions of credentials.', 'Pending');

-- Priya Patel requests Dr. Aris Thorne
INSERT INTO public.mentorship_requests (idea_id, student_id, mentor_id, message, status) VALUES
('a0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-222222222222', '22222222-2222-2222-2222-111111111111', 
 'Dear Professor, we would appreciate it if you could review our architecture design for logging metadata from IoT devices securely onto Cardano preview network.', 'Accepted');


-- 8. Insert Developer Applications
-- Tushar Gupta applies to EduBlocks
INSERT INTO public.developer_applications (idea_id, developer_id, cover_letter, status) VALUES
('a0000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 
 'Hey Rohan, I am a backend developer at IIT Delhi. I have worked extensively with Next.js API endpoints and database setups. I would love to build the backend logic for EduBlocks.', 'Pending');

-- Devansh Joshi applies to FarmLedger
INSERT INTO public.developer_applications (idea_id, developer_id, cover_letter, status) VALUES
('a0000000-0000-0000-0000-000000000004', '33333333-3333-3333-3333-555555555555', 
 'Hi Sneha, the microlending model is extremely noble and impactful. I can write smart contract validations to ensure funds are released only when key delivery triggers are verified.', 'Accepted');


-- 9. Insert Notifications
INSERT INTO public.notifications (user_id, title, message, type) VALUES
('11111111-1111-1111-1111-111111111111', 'Cardano Transaction Confirmed', 'Your startup idea EduBlocks has been successfully registered on Cardano Preview Testnet. Tx: 4a0f44...2219', 'blockchain'),
('11111111-1111-1111-1111-222222222222', 'Milestone Approved', 'Your milestone "IoT Firmware Development" has been approved by Dr. Aris Thorne.', 'milestone'),
('11111111-1111-1111-1111-111111111111', 'New Developer Application', 'Tushar Gupta has applied to join the EduBlocks team.', 'application');

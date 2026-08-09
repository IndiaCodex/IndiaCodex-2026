export interface Profile {
  id: string;
  role: 'student' | 'mentor' | 'developer' | 'admin';
  full_name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  github_url?: string;
  portfolio_url?: string;
}

export interface Idea {
  id: string;
  owner_id: string;
  title: string;
  short_description: string;
  category: string;
  stage: 'Concept' | 'Prototype' | 'MVP' | 'Growth';
  visibility: 'private' | 'public';
  problem_statement: string;
  proposed_solution: string;
  target_users: string;
  unique_value: string;
  expected_impact: string;
  revenue_model: string;
  market_opportunity: string;
  competitors: string;
  required_team_members: string;
  required_mentor_expertise: string;
  pitch_deck_url?: string;
  prototype_url?: string;
  github_repo_url?: string;
  supporting_docs_url?: string;
  canonical_payload: any;
  idea_hash: string;
  blockchain_status: 'Pending' | 'Submitted' | 'Confirmed' | 'Failed' | 'Demo';
  created_at: string;
}

export interface BlockchainRecord {
  id: string;
  idea_id: string;
  idea_hash: string;
  canonical_payload_version: string;
  transaction_hash: string;
  script_address: string;
  output_index: number;
  utxo_reference: string;
  network: string;
  metadata_label: number;
  block_height?: number;
  confirmation_status: 'Pending' | 'Confirmed' | 'Failed' | 'Demo';
  registered_at: string;
  created_at?: string;
}

export interface Milestone {
  id: string;
  idea_id: string;
  title: string;
  description: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Approved';
  due_date: string;
  approved_by?: string;
}

export interface TeamMember {
  id: string;
  idea_id: string;
  user_id: string;
  role_in_team: string;
  joined_at: string;
}

export interface MentorFeedback {
  id: string;
  idea_id: string;
  mentor_id: string;
  feedback_text: string;
  rating_readiness: number;
  created_at: string;
}

export interface MentorshipRequest {
  id: string;
  idea_id: string;
  student_id: string;
  mentor_id: string;
  message?: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
  created_at: string;
}

export interface DeveloperApplication {
  id: string;
  idea_id: string;
  developer_id: string;
  cover_letter?: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  read: boolean;
  type: 'application' | 'feedback' | 'milestone' | 'blockchain' | 'team';
  created_at: string;
}

export const demoProfiles: Profile[] = [
  // Students
  {
    id: '11111111-1111-1111-1111-111111111111',
    role: 'student',
    full_name: 'Rohan Sharma',
    email: 'rohan@launchnest.dev',
    avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Rohan',
    bio: 'CS Senior at IIT Delhi. Passionate about Web3 and decentralization.',
  },
  {
    id: '11111111-1111-1111-1111-222222222222',
    role: 'student',
    full_name: 'Priya Patel',
    email: 'priya@launchnest.dev',
    avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Priya',
    bio: 'Pre-final year IT student at BITS Pilani. Climate tech enthusiast.',
  },
  {
    id: '11111111-1111-1111-1111-333333333333',
    role: 'student',
    full_name: 'Amit Verma',
    email: 'amit@launchnest.dev',
    avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Amit',
    bio: 'Bioinformatics major at VIT. Building at the intersection of healthcare and blockchain.',
  },
  {
    id: '11111111-1111-1111-1111-444444444444',
    role: 'student',
    full_name: 'Sneha Reddy',
    email: 'sneha@launchnest.dev',
    avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Sneha',
    bio: 'Economics and Finance student at SRCC. Exploring DeFi models for rural lending.',
  },
  {
    id: '11111111-1111-1111-1111-555555555555',
    role: 'student',
    full_name: 'Vikram Singh',
    email: 'vikram@launchnest.dev',
    avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Vikram',
    bio: 'Software engineering student at DTU. Passionate about P2P networks.',
  },

  // Mentors
  {
    id: '22222222-2222-2222-2222-111111111111',
    role: 'mentor',
    full_name: 'Dr. Aris Thorne',
    email: 'aris@launchnest.dev',
    avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Aris',
    bio: 'Professor of Cryptography and Cardano smart contract developer. Ex-IOHK researcher.',
    github_url: 'https://github.com/aris-thorne',
    portfolio_url: 'https://aris.dev',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    role: 'mentor',
    full_name: 'Sunita Rao',
    email: 'sunita@launchnest.dev',
    avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Sunita',
    bio: 'General Partner at Aether Ventures. Mentoring student startups for 8+ years.',
    portfolio_url: 'https://aether.vc',
  },
  {
    id: '22222222-2222-2222-2222-333333333333',
    role: 'mentor',
    full_name: 'Charles Hoskinson',
    email: 'charles@launchnest.dev',
    avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Charles',
    bio: 'Founder of Cardano & CEO of Input Output Global. Promoting open-source decentralization in India.',
    github_url: 'https://github.com/input-output-hk',
    portfolio_url: 'https://hoskinson.io',
  },
  {
    id: '22222222-2222-2222-2222-444444444444',
    role: 'mentor',
    full_name: 'Rajesh Kumar',
    email: 'rajesh@launchnest.dev',
    avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Rajesh',
    bio: 'SaaS founder and growth advisor. Helping startups scale from 0 to 1.',
    github_url: 'https://github.com/rajesh-saas',
    portfolio_url: 'https://kumar.co',
  },

  // Developers
  {
    id: '33333333-3333-3333-3333-111111111111',
    role: 'developer',
    full_name: 'Kabir Mehta',
    email: 'kabir@launchnest.dev',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kabir',
    bio: 'React and Tailwind specialist. Love building fluid interactive dashboards.',
    github_url: 'https://github.com/kabir-mehta',
    portfolio_url: 'https://kabir.me',
  },
  {
    id: '33333333-3333-3333-3333-222222222222',
    role: 'developer',
    full_name: 'Ananya Sen',
    email: 'ananya@launchnest.dev',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ananya',
    bio: 'Cardano smart contract researcher and Haskeller. Transitioning into Aiken.',
    github_url: 'https://github.com/ananya-cardano',
    portfolio_url: 'https://ananyasen.in',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    role: 'developer',
    full_name: 'Tushar Gupta',
    email: 'tushar@launchnest.dev',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tushar',
    bio: 'Full stack Next.js & Node.js developer. Experienced with databases.',
    github_url: 'https://github.com/tushar-g',
    portfolio_url: 'https://tushar.codes',
  },
  {
    id: '33333333-3333-3333-3333-444444444444',
    role: 'developer',
    full_name: 'Meera Nair',
    email: 'meera@launchnest.dev',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Meera',
    bio: 'UI/UX designer. Making complex blockchain apps look simple and beautiful.',
    portfolio_url: 'https://behance.net/meera',
  },
  {
    id: '33333333-3333-3333-3333-555555555555',
    role: 'developer',
    full_name: 'Devansh Joshi',
    email: 'devansh@launchnest.dev',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Devansh',
    bio: 'System level programmer learning smart contracts in Aiken and Rust.',
    github_url: 'https://github.com/devansh-j',
  },
  {
    id: '33333333-3333-3333-3333-666666666666',
    role: 'developer',
    full_name: 'Aisha Khan',
    email: 'aisha@launchnest.dev',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aisha',
    bio: 'Database administrator and API architect. Devops explorer.',
    github_url: 'https://github.com/aisha-k',
    portfolio_url: 'https://aisha.dev',
  },

  // Admin
  {
    id: '44444444-4444-4444-4444-111111111111',
    role: 'admin',
    full_name: 'Admin Overseer',
    email: 'admin@launchnest.dev',
    avatar_url: 'https://api.dicebear.com/7.x/identicon/svg?seed=Admin',
    bio: 'LaunchNest administrator account.',
  },
];

export const demoIdeas: Idea[] = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    owner_id: '11111111-1111-1111-1111-111111111111',
    title: 'EduBlocks',
    short_description: 'A decentralized credential registry on Cardano to prevent certificate fraud.',
    category: 'EdTech / Web3',
    stage: 'Concept',
    visibility: 'public',
    problem_statement: 'University credential and certificate fraud is rising globally, making verifying documents slow and expensive.',
    proposed_solution: 'Create tamper-proof blockchain certificates issued by universities via Cardano smart contracts.',
    target_users: 'Universities, students, recruiters, and screening agencies.',
    unique_value: 'Low transaction cost, instant cryptographic validation, zero reliance on a centralized verification database.',
    expected_impact: 'Reduce recruitment screening times from 2 weeks to 2 seconds and fully eliminate certificate counterfeiting.',
    revenue_model: 'B2B subscription fee for universities per credential issued.',
    market_opportunity: 'Global background verification market valued at $5B+ annually.',
    competitors: 'Accredible, Parchment, local verification agencies.',
    required_team_members: 'Full Stack Developer, UX Designer',
    required_mentor_expertise: 'Smart Contract Development, Higher Ed Partnerships',
    pitch_deck_url: 'https://docs.google.com/presentation/d/edublocks',
    prototype_url: 'https://edublocks.vercel.app',
    github_repo_url: 'https://github.com/launchnest/edublocks',
    canonical_payload: {
      owner_id: '11111111-1111-1111-1111-111111111111',
      problem_statement: 'University credential and certificate fraud is rising globally, making verifying documents slow and expensive.',
      proposed_solution: 'Create tamper-proof blockchain certificates issued by universities via Cardano smart contracts.',
      short_description: 'A decentralized credential registry on Cardano to prevent certificate fraud.',
      submitted_at: 1718192000,
      target_users: 'Universities, students, recruiters, and screening agencies.',
      title: 'EduBlocks',
    },
    idea_hash: '1a46b5a34f8a8461ee6b6ee2b7c6cb34ea72a8c3d6c1b3f7f85885a06900ee9c',
    blockchain_status: 'Confirmed',
    created_at: '2026-07-10T14:30:00Z',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000002',
    owner_id: '11111111-1111-1111-1111-222222222222',
    title: 'GreenTrace',
    short_description: 'Supply chain transparency for carbon offset validation.',
    category: 'Sustainability / IoT',
    stage: 'Prototype',
    visibility: 'public',
    problem_statement: 'Carbon offset credits are double-counted and lack verified tracking, leading to greenwashing.',
    proposed_solution: 'Use IoT sensors and Cardano smart contracts to record live carbon offset logs directly to the ledger.',
    target_users: 'Corporate sustainability departments, ESG audit firms, offset providers.',
    unique_value: 'Live hardware audit integration, tamper-proof Cardano ledger data.',
    expected_impact: 'Increase investor trust in carbon offset projects by 90% and prevent tokenized asset double-counting.',
    revenue_model: 'SaaS audit fees and transaction commissions on carbon credit sales.',
    market_opportunity: 'Voluntary carbon offset market projected to reach $10B+ by 2030.',
    competitors: 'Verra, Gold Standard, Toucan Protocol.',
    required_team_members: 'IoT Firmware Engineer, Solidity/Aiken Dev',
    required_mentor_expertise: 'Carbon Accounting Standards, IoT Systems Integration',
    pitch_deck_url: 'https://docs.google.com/presentation/d/greentrace',
    prototype_url: 'https://greentrace.io',
    github_repo_url: 'https://github.com/launchnest/greentrace',
    canonical_payload: {
      owner_id: '11111111-1111-1111-1111-222222222222',
      problem_statement: 'Carbon offset credits are double-counted and lack verified tracking, leading to greenwashing.',
      proposed_solution: 'Use IoT sensors and Cardano smart contracts to record live carbon offset logs directly to the ledger.',
      short_description: 'Supply chain transparency for carbon offset validation.',
      submitted_at: 1718193000,
      target_users: 'Corporate sustainability departments, ESG audit firms, offset providers.',
      title: 'GreenTrace',
    },
    idea_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    blockchain_status: 'Confirmed',
    created_at: '2026-07-11T09:15:00Z',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000003',
    owner_id: '11111111-1111-1111-1111-333333333333',
    title: 'HealSync',
    short_description: 'Secure medical records transfer using zero-knowledge proofs and Cardano.',
    category: 'Healthcare / Security',
    stage: 'MVP',
    visibility: 'public',
    problem_statement: 'Patient medical records are fragmented, and sharing them insecurely risks HIPAA compliance violations.',
    proposed_solution: 'Implement ZK-proofs to prove eligibility and treatment history without exposing private patient data.',
    target_users: 'Hospitals, insurance companies, patients.',
    unique_value: 'Ultimate privacy compliance, student founder access to health records database, high security.',
    expected_impact: 'Zero patient leakages, patient controls own data permissions on Cardano ledger.',
    revenue_model: 'API integration fee per query for health insurers.',
    market_opportunity: 'Digital health market size is $200B+ globally.',
    competitors: 'Epic Systems, local electronic health record networks.',
    required_team_members: 'Rust Dev, ZK Cryptographer',
    required_mentor_expertise: 'HIPAA Regulations, Healthcare API Integration',
    pitch_deck_url: 'https://docs.google.com/presentation/d/healsync',
    prototype_url: 'https://healsync.org',
    github_repo_url: 'https://github.com/launchnest/healsync',
    canonical_payload: {
      owner_id: '11111111-1111-1111-1111-333333333333',
      problem_statement: 'Patient medical records are fragmented, and sharing them insecurely risks HIPAA compliance violations.',
      proposed_solution: 'Implement ZK-proofs to prove eligibility and treatment history without exposing private patient data.',
      short_description: 'Secure medical records transfer using zero-knowledge proofs and Cardano.',
      submitted_at: 1718194000,
      target_users: 'Hospitals, insurance companies, patients.',
      title: 'HealSync',
    },
    idea_hash: '1b020a597fc0e29bca598d1a1b181a4a4b2a8d3e69182390f7a0c8ef2882a8bf',
    blockchain_status: 'Pending',
    created_at: '2026-07-12T08:00:00Z',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000004',
    owner_id: '11111111-1111-1111-1111-444444444444',
    title: 'FarmLedger',
    short_description: 'Microlending platform for rural Indian farmers using Cardano smart contracts.',
    category: 'AgriTech / DeFi',
    stage: 'Concept',
    visibility: 'public',
    problem_statement: 'Smallholder farmers in rural India cannot access credit from formal banks due to lack of collateral.',
    proposed_solution: 'Create micro-lending pools funded globally, disbursed as ADA/stablecoins, and secured via smart contract escrow.',
    target_users: 'Rural farmers, global micro-lenders, local credit unions.',
    unique_value: 'High interest yields for lenders, low administration overhead for farmers, decentralized reputation scoring.',
    expected_impact: 'Reduce interest rates for smallholder farmers from 36% (local lenders) to under 8% per annum.',
    revenue_model: '1% service charge on loan volume payouts.',
    market_opportunity: 'Agri-credit demand in India exceeds $150B annually.',
    competitors: 'Kiva, Rang De, local microfinance banks.',
    required_team_members: 'Mobile App Developer, Agri-Economist',
    required_mentor_expertise: 'Rural Credit Systems, Local Compliance & Regulatory',
    pitch_deck_url: 'https://docs.google.com/presentation/d/farmledger',
    canonical_payload: {
      owner_id: '11111111-1111-1111-1111-444444444444',
      problem_statement: 'Smallholder farmers in rural India cannot access credit from formal banks due to lack of collateral.',
      proposed_solution: 'Create micro-lending pools funded globally, disbursed as ADA/stablecoins, and secured via smart contract escrow.',
      short_description: 'Microlending platform for rural Indian farmers using Cardano smart contracts.',
      submitted_at: 1718195000,
      target_users: 'Rural farmers, global micro-lenders, local credit unions.',
      title: 'FarmLedger',
    },
    idea_hash: '2c040d867ac0e59eca598d1a1b181a4a4b2a8d3e69182390f7a0c8ef2882b9cf',
    blockchain_status: 'Demo',
    created_at: '2026-07-12T10:00:00Z',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000005',
    owner_id: '11111111-1111-1111-1111-555555555555',
    title: 'BazaarDAO',
    short_description: 'Decentralized local e-commerce with peer-to-peer micro-escrows.',
    category: 'E-Commerce / Logistics',
    stage: 'Concept',
    visibility: 'private',
    problem_statement: 'Centralized e-commerce platforms charge heavy commission fees (15-30%) and delay merchant payouts.',
    proposed_solution: 'A peer-to-peer marketplace that uses Cardano smart contracts to escrow payments until delivery is verified.',
    target_users: 'Local merchants, freelance delivery riders, neighborhood consumers.',
    unique_value: '0% marketplace fees, instant payouts upon successful proof-of-delivery.',
    expected_impact: 'Cut merchant marketing and distribution costs, saving small businesses up to 25% on revenues.',
    revenue_model: 'Small protocol-level transaction fees for arbitration services.',
    market_opportunity: 'Quick-commerce market in India is expanding at 40% YoY.',
    competitors: 'ONDC, Swiggy Instamart, Dunzo.',
    required_team_members: 'Arbitration UI builder, Solidity Dev',
    required_mentor_expertise: 'P2P Escrows, Dispute Resolution Protocols',
    canonical_payload: {
      owner_id: '11111111-1111-1111-1111-555555555555',
      problem_statement: 'Centralized e-commerce platforms charge heavy commission fees (15-30%) and delay merchant payouts.',
      proposed_solution: 'A peer-to-peer marketplace that uses Cardano smart contracts to escrow payments until delivery is verified.',
      short_description: 'Decentralized local e-commerce with peer-to-peer micro-escrows.',
      submitted_at: 1718196000,
      target_users: 'Local merchants, freelance delivery riders, neighborhood consumers.',
      title: 'BazaarDAO',
    },
    idea_hash: '5b040e867ac0e59eca598d1a1b181a4a4b2a8d3e69182390f7a0c8ef2882c9df',
    blockchain_status: 'Pending',
    created_at: '2026-07-12T11:00:00Z',
  },
];

export const demoBlockchainRecords: BlockchainRecord[] = [
  {
    id: 'c0000000-0000-0000-0000-000000000001',
    idea_id: 'a0000000-0000-0000-0000-000000000001',
    idea_hash: '1a46b5a34f8a8461ee6b6ee2b7c6cb34ea72a8c3d6c1b3f7f85885a06900ee9c',
    canonical_payload_version: '1.0',
    transaction_hash: '4a0f443b7bc902c67ef1ad499cc8742b781da268598125191c9588665fca2219',
    script_address: 'addr_test1wzdm6f183dbfa91461fffae3b60dc1d4a5c531d044fde1851275bb25',
    output_index: 0,
    utxo_reference: '4a0f443b7bc902c67ef1ad499cc8742b781da268598125191c9588665fca2219#0',
    network: 'preview',
    metadata_label: 674,
    block_height: 412588,
    confirmation_status: 'Confirmed',
    registered_at: '2026-07-10T14:30:00Z',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000002',
    idea_id: 'a0000000-0000-0000-0000-000000000002',
    idea_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    canonical_payload_version: '1.0',
    transaction_hash: '8b8f2c3d5e23910cd6cde7a1b181a4a4b2a8d3e69182390f7a0c8ef2882a8bfb',
    script_address: 'addr_test1wzdm6f183dbfa91461fffae3b60dc1d4a5c531d044fde1851275bb25',
    output_index: 0,
    utxo_reference: '8b8f2c3d5e23910cd6cde7a1b181a4a4b2a8d3e69182390f7a0c8ef2882a8bfb#0',
    network: 'preview',
    metadata_label: 674,
    block_height: 413204,
    confirmation_status: 'Confirmed',
    registered_at: '2026-07-11T09:15:00Z',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000004',
    idea_id: 'a0000000-0000-0000-0000-000000000004',
    idea_hash: '2c040d867ac0e59eca598d1a1b181a4a4b2a8d3e69182390f7a0c8ef2882b9cf',
    canonical_payload_version: '1.0',
    transaction_hash: 'demo_72a445ffce902b6de1a4cb90bfd8d672f10b8ea79cc2b7c6cb34ea72a8c3d6ff',
    script_address: 'addr_test1wzdm6f183dbfa91461fffae3b60dc1d4a5c531d044fde1851275bb25',
    output_index: 0,
    utxo_reference: 'demo_72a445ffce902b6de1a4cb90bfd8d672f10b8ea79cc2b7c6cb34ea72a8c3d6ff#0',
    network: 'preview',
    metadata_label: 674,
    block_height: 414112,
    confirmation_status: 'Demo',
    registered_at: '2026-07-12T10:00:00Z',
  },
];

export const demoMilestones: Milestone[] = [
  {
    id: 'd0000000-0000-0000-0000-000000000011',
    idea_id: 'a0000000-0000-0000-0000-000000000001',
    title: 'Finalize Smart Contract Code',
    description: 'Write and compile Aiken code for credential registries.',
    status: 'Approved',
    due_date: '2026-07-05T00:00:00Z',
    approved_by: '22222222-2222-2222-2222-111111111111',
  },
  {
    id: 'd0000000-0000-0000-0000-000000000012',
    idea_id: 'a0000000-0000-0000-0000-000000000001',
    title: 'Build Verification Portal',
    description: 'Create the front-end dashboard allowing recruiters to search hashes.',
    status: 'In Progress',
    due_date: '2026-07-20T00:00:00Z',
  },
  {
    id: 'd0000000-0000-0000-0000-000000000013',
    idea_id: 'a0000000-0000-0000-0000-000000000001',
    title: 'Integrate Mesh SDK Wallet',
    description: 'Deploy backend signing infrastructure and plug in Nami browser wallet.',
    status: 'Pending',
    due_date: '2026-08-10T00:00:00Z',
  },
  {
    id: 'd0000000-0000-0000-0000-000000000021',
    idea_id: 'a0000000-0000-0000-0000-000000000002',
    title: 'IoT Firmware Development',
    description: 'Connect ESP32 carbon output monitor to send data packages.',
    status: 'Approved',
    due_date: '2026-06-30T00:00:00Z',
    approved_by: '22222222-2222-2222-2222-111111111111',
  },
  {
    id: 'd0000000-0000-0000-0000-000000000022',
    idea_id: 'a0000000-0000-0000-0000-000000000002',
    title: 'Cardano Metadata Integration',
    description: 'Encode IoT logging payloads into metadata transactions under label 674.',
    status: 'Completed',
    due_date: '2026-07-10T00:00:00Z',
  },
];

export const demoTeamMembers: TeamMember[] = [
  {
    id: 't1',
    idea_id: 'a0000000-0000-0000-0000-000000000001',
    user_id: '11111111-1111-1111-1111-111111111111',
    role_in_team: 'Founder & Project Manager',
    joined_at: '2026-07-01T09:00:00Z',
  },
  {
    id: 't2',
    idea_id: 'a0000000-0000-0000-0000-000000000001',
    user_id: '33333333-3333-3333-3333-111111111111',
    role_in_team: 'Lead Front-end Developer',
    joined_at: '2026-07-04T11:30:00Z',
  },
  {
    id: 't3',
    idea_id: 'a0000000-0000-0000-0000-000000000002',
    user_id: '11111111-1111-1111-1111-222222222222',
    role_in_team: 'Founder & Hardware Lead',
    joined_at: '2026-07-02T10:00:00Z',
  },
  {
    id: 't4',
    idea_id: 'a0000000-0000-0000-0000-000000000002',
    user_id: '33333333-3333-3333-3333-222222222222',
    role_in_team: 'Cardano Plutus Specialist',
    joined_at: '2026-07-05T14:00:00Z',
  },
];

export const demoFeedback: MentorFeedback[] = [
  {
    id: 'f1',
    idea_id: 'a0000000-0000-0000-0000-000000000001',
    mentor_id: '22222222-2222-2222-2222-111111111111',
    feedback_text: 'Great choice of validator design. The spend signature checks are extremely secure. Suggesting you test with pre-compiled plutus.json blueprints in the Next.js client for faster transaction building. The overall design looks very production-ready.',
    rating_readiness: 5,
    created_at: '2026-07-11T16:00:00Z',
  },
  {
    id: 'f2',
    idea_id: 'a0000000-0000-0000-0000-000000000004',
    mentor_id: '22222222-2222-2222-2222-222222222222',
    feedback_text: 'The business model is exciting. Connecting global capital directly to rural farmers using micro-escrows solves real funding bottlenecks. Make sure to double check local financial regulations regarding stablecoin distributions.',
    rating_readiness: 4,
    created_at: '2026-07-12T10:30:00Z',
  },
];

export const demoMentorshipRequests: MentorshipRequest[] = [
  {
    id: 'mr1',
    idea_id: 'a0000000-0000-0000-0000-000000000001',
    student_id: '11111111-1111-1111-1111-111111111111',
    mentor_id: '22222222-2222-2222-2222-333333333333',
    message: 'Hi Charles, we are building EduBlocks to solve credential fraud in India. We would love to get your advice on optimizing the on-chain storage cost for scaling to millions of credentials.',
    status: 'Pending',
    created_at: '2026-07-12T08:00:00Z',
  },
  {
    id: 'mr2',
    idea_id: 'a0000000-0000-0000-0000-000000000002',
    student_id: '11111111-1111-1111-1111-222222222222',
    mentor_id: '22222222-2222-2222-2222-111111111111',
    message: 'Dear Professor, we would appreciate it if you could review our architecture design for logging metadata from IoT devices securely onto Cardano preview network.',
    status: 'Accepted',
    created_at: '2026-07-11T12:00:00Z',
  },
];

export const demoDeveloperApplications: DeveloperApplication[] = [
  {
    id: 'da1',
    idea_id: 'a0000000-0000-0000-0000-000000000001',
    developer_id: '33333333-3333-3333-3333-333333333333',
    cover_letter: 'Hey Rohan, I am a backend developer at IIT Delhi. I have worked extensively with Next.js API endpoints and database setups. I would love to build the backend logic for EduBlocks.',
    status: 'Pending',
    created_at: '2026-07-12T09:00:00Z',
  },
  {
    id: 'da2',
    idea_id: 'a0000000-0000-0000-0000-000000000004',
    developer_id: '33333333-3333-3333-3333-555555555555',
    cover_letter: 'Hi Sneha, the microlending model is extremely noble and impactful. I can write smart contract validations to ensure funds are released only when key delivery triggers are verified.',
    status: 'Accepted',
    created_at: '2026-07-12T10:15:00Z',
  },
];

export const demoNotifications: Notification[] = [
  {
    id: 'n1',
    user_id: '11111111-1111-1111-1111-111111111111',
    title: 'Cardano Transaction Confirmed',
    message: 'Your startup idea EduBlocks has been successfully registered on Cardano Preview Testnet. Tx: 4a0f44...2219',
    read: false,
    type: 'blockchain',
    created_at: '2026-07-10T14:35:00Z',
  },
  {
    id: 'n2',
    user_id: '11111111-1111-1111-1111-222222222222',
    title: 'Milestone Approved',
    message: 'Your milestone "IoT Firmware Development" has been approved by Dr. Aris Thorne.',
    read: false,
    type: 'milestone',
    created_at: '2026-06-30T17:00:00Z',
  },
  {
    id: 'n3',
    user_id: '11111111-1111-1111-1111-111111111111',
    title: 'New Developer Application',
    message: 'Tushar Gupta has applied to join the EduBlocks team.',
    read: true,
    type: 'application',
    created_at: '2026-07-12T09:05:00Z',
  },
];

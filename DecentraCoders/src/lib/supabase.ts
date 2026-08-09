import * as demo from './demoData';

// Verify if environment variables are configured
export const isDemoDb = true;

// LocalStorage key constants
const KEYS = {
  PROFILES: 'ln_profiles',
  IDEAS: 'ln_ideas',
  BLOCKCHAIN: 'ln_blockchain_records',
  MILESTONES: 'ln_milestones',
  TEAM_MEMBERS: 'ln_team_members',
  FEEDBACK: 'ln_feedback',
  MENTORSHIP: 'ln_mentorship',
  APPLICATIONS: 'ln_applications',
  NOTIFICATIONS: 'ln_notifications',
  CURRENT_USER: 'ln_current_user',
};

// Helper to initialize local storage data if it does not exist
function initLocalStorage() {
  if (typeof window === 'undefined') return;

  if (!localStorage.getItem(KEYS.PROFILES)) {
    localStorage.setItem(KEYS.PROFILES, JSON.stringify(demo.demoProfiles));
  }
  if (!localStorage.getItem(KEYS.IDEAS)) {
    localStorage.setItem(KEYS.IDEAS, JSON.stringify(demo.demoIdeas));
  }
  if (!localStorage.getItem(KEYS.BLOCKCHAIN)) {
    localStorage.setItem(KEYS.BLOCKCHAIN, JSON.stringify(demo.demoBlockchainRecords));
  }
  if (!localStorage.getItem(KEYS.MILESTONES)) {
    localStorage.setItem(KEYS.MILESTONES, JSON.stringify(demo.demoMilestones));
  }
  if (!localStorage.getItem(KEYS.TEAM_MEMBERS)) {
    localStorage.setItem(KEYS.TEAM_MEMBERS, JSON.stringify(demo.demoTeamMembers));
  }
  if (!localStorage.getItem(KEYS.FEEDBACK)) {
    localStorage.setItem(KEYS.FEEDBACK, JSON.stringify(demo.demoFeedback));
  }
  if (!localStorage.getItem(KEYS.MENTORSHIP)) {
    localStorage.setItem(KEYS.MENTORSHIP, JSON.stringify(demo.demoMentorshipRequests));
  }
  if (!localStorage.getItem(KEYS.APPLICATIONS)) {
    localStorage.setItem(KEYS.APPLICATIONS, JSON.stringify(demo.demoDeveloperApplications));
  }
  if (!localStorage.getItem(KEYS.NOTIFICATIONS)) {
    localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(demo.demoNotifications));
  }
  if (localStorage.getItem(KEYS.CURRENT_USER) === null) {
    // Default logged in user for demo purposes is Rohan Sharma (student)
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(demo.demoProfiles[0]));
  }
}

// Local helper to read/write storage
function readLocal<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  initLocalStorage();
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

function writeLocal<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

export const dbService = {
  // --- CURRENT USER AUTH SIMULATION ---
  getCurrentUser(): demo.Profile | null {
    if (typeof window === 'undefined') return null;
    initLocalStorage();
    const raw = localStorage.getItem(KEYS.CURRENT_USER);
    if (!raw || raw === 'null') return null;
    return JSON.parse(raw);
  },

  setCurrentUser(user: demo.Profile | null) {
    if (typeof window === 'undefined') return;
    if (user) {
      localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.setItem(KEYS.CURRENT_USER, 'null');
    }
  },

  // --- PROFILES ---
  async getProfiles(): Promise<demo.Profile[]> {
    return readLocal<demo.Profile>(KEYS.PROFILES);
  },

  async getProfileById(id: string): Promise<demo.Profile | null> {
    const list = readLocal<demo.Profile>(KEYS.PROFILES);
    return list.find((p) => p.id === id) || null;
  },

  async updateProfile(id: string, updates: Partial<demo.Profile>): Promise<demo.Profile> {
    const list = readLocal<demo.Profile>(KEYS.PROFILES);
    const index = list.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Profile not found');
    list[index] = { ...list[index], ...updates };
    writeLocal(KEYS.PROFILES, list);
    
    // If updating current user, sync state
    const curr = this.getCurrentUser();
    if (curr && curr.id === id) {
      this.setCurrentUser(list[index]);
    }
    return list[index];
  },

  // --- IDEAS ---
  async getIdeas(): Promise<demo.Idea[]> {
    return readLocal<demo.Idea>(KEYS.IDEAS);
  },

  async getIdeaById(id: string): Promise<demo.Idea | null> {
    const list = readLocal<demo.Idea>(KEYS.IDEAS);
    return list.find((i) => i.id === id) || null;
  },

  async createIdea(idea: Omit<demo.Idea, 'id' | 'created_at' | 'blockchain_status'>): Promise<demo.Idea> {
    const list = readLocal<demo.Idea>(KEYS.IDEAS);
    const newIdea: demo.Idea = {
      ...idea,
      id: crypto.randomUUID(),
      blockchain_status: 'Pending',
      created_at: new Date().toISOString(),
    };
    list.unshift(newIdea);
    writeLocal(KEYS.IDEAS, list);
    return newIdea;
  },

  async updateIdea(id: string, updates: Partial<demo.Idea>): Promise<demo.Idea> {
    const list = readLocal<demo.Idea>(KEYS.IDEAS);
    const index = list.findIndex((i) => i.id === id);
    if (index === -1) throw new Error('Idea not found');
    list[index] = { ...list[index], ...updates };
    writeLocal(KEYS.IDEAS, list);
    return list[index];
  },

  // --- BLOCKCHAIN RECORDS ---
  async getBlockchainRecords(): Promise<demo.BlockchainRecord[]> {
    return readLocal<demo.BlockchainRecord>(KEYS.BLOCKCHAIN);
  },

  async getBlockchainRecordByIdeaId(ideaId: string): Promise<demo.BlockchainRecord | null> {
    const list = readLocal<demo.BlockchainRecord>(KEYS.BLOCKCHAIN);
    return list.find((r) => r.idea_id === ideaId) || null;
  },

  async createBlockchainRecord(record: Omit<demo.BlockchainRecord, 'id' | 'created_at'>): Promise<demo.BlockchainRecord> {
    const list = readLocal<demo.BlockchainRecord>(KEYS.BLOCKCHAIN);
    const newRecord: demo.BlockchainRecord = {
      ...record,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    list.push(newRecord);
    writeLocal(KEYS.BLOCKCHAIN, list);

    // Automatically update the blockchain_status of the corresponding idea
    await this.updateIdea(record.idea_id, { blockchain_status: record.confirmation_status });

    return newRecord;
  },

  // --- MILESTONES ---
  async getMilestones(ideaId: string): Promise<demo.Milestone[]> {
    const list = readLocal<demo.Milestone>(KEYS.MILESTONES);
    return list.filter((m) => m.idea_id === ideaId);
  },

  async createMilestone(milestone: Omit<demo.Milestone, 'id'>): Promise<demo.Milestone> {
    const list = readLocal<demo.Milestone>(KEYS.MILESTONES);
    const newMilestone: demo.Milestone = {
      ...milestone,
      id: crypto.randomUUID(),
    };
    list.push(newMilestone);
    writeLocal(KEYS.MILESTONES, list);
    return newMilestone;
  },

  async updateMilestone(id: string, updates: Partial<demo.Milestone>): Promise<demo.Milestone> {
    const list = readLocal<demo.Milestone>(KEYS.MILESTONES);
    const index = list.findIndex((m) => m.id === id);
    if (index === -1) throw new Error('Milestone not found');
    list[index] = { ...list[index], ...updates };
    writeLocal(KEYS.MILESTONES, list);
    return list[index];
  },

  // --- TEAM MEMBERS ---
  async getTeamMembers(ideaId: string): Promise<demo.TeamMember[]> {
    const list = readLocal<demo.TeamMember>(KEYS.TEAM_MEMBERS);
    return list.filter((t) => t.idea_id === ideaId);
  },

  async addTeamMember(ideaId: string, userId: string, roleInTeam: string): Promise<demo.TeamMember> {
    const list = readLocal<demo.TeamMember>(KEYS.TEAM_MEMBERS);
    const duplicate = list.find((t) => t.idea_id === ideaId && t.user_id === userId);
    if (duplicate) return duplicate;
    const newMember: demo.TeamMember = {
      id: crypto.randomUUID(),
      idea_id: ideaId,
      user_id: userId,
      role_in_team: roleInTeam,
      joined_at: new Date().toISOString(),
    };
    list.push(newMember);
    writeLocal(KEYS.TEAM_MEMBERS, list);
    return newMember;
  },

  // --- MENTOR FEEDBACK ---
  async getFeedback(ideaId: string): Promise<demo.MentorFeedback[]> {
    const list = readLocal<demo.MentorFeedback>(KEYS.FEEDBACK);
    return list.filter((f) => f.idea_id === ideaId);
  },

  async createFeedback(feedback: Omit<demo.MentorFeedback, 'id' | 'created_at'>): Promise<demo.MentorFeedback> {
    const list = readLocal<demo.MentorFeedback>(KEYS.FEEDBACK);
    const newFeedback: demo.MentorFeedback = {
      ...feedback,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    list.push(newFeedback);
    writeLocal(KEYS.FEEDBACK, list);
    return newFeedback;
  },

  // --- MENTORSHIP REQUESTS ---
  async getMentorshipRequests(): Promise<demo.MentorshipRequest[]> {
    return readLocal<demo.MentorshipRequest>(KEYS.MENTORSHIP);
  },

  async createMentorshipRequest(req: Omit<demo.MentorshipRequest, 'id' | 'created_at' | 'status'>): Promise<demo.MentorshipRequest> {
    const list = readLocal<demo.MentorshipRequest>(KEYS.MENTORSHIP);
    const newReq: demo.MentorshipRequest = {
      ...req,
      id: crypto.randomUUID(),
      status: 'Pending',
      created_at: new Date().toISOString(),
    };
    list.push(newReq);
    writeLocal(KEYS.MENTORSHIP, list);
    return newReq;
  },

  async updateMentorshipRequest(id: string, status: 'Pending' | 'Accepted' | 'Rejected'): Promise<demo.MentorshipRequest> {
    const list = readLocal<demo.MentorshipRequest>(KEYS.MENTORSHIP);
    const index = list.findIndex((m) => m.id === id);
    if (index === -1) throw new Error('Request not found');
    list[index].status = status;
    writeLocal(KEYS.MENTORSHIP, list);
    return list[index];
  },

  // --- DEVELOPER APPLICATIONS ---
  async getApplications(): Promise<demo.DeveloperApplication[]> {
    return readLocal<demo.DeveloperApplication>(KEYS.APPLICATIONS);
  },

  async createApplication(app: Omit<demo.DeveloperApplication, 'id' | 'created_at' | 'status'>): Promise<demo.DeveloperApplication> {
    const list = readLocal<demo.DeveloperApplication>(KEYS.APPLICATIONS);
    const newApp: demo.DeveloperApplication = {
      ...app,
      id: crypto.randomUUID(),
      status: 'Pending',
      created_at: new Date().toISOString(),
    };
    list.push(newApp);
    writeLocal(KEYS.APPLICATIONS, list);
    return newApp;
  },

  async updateApplication(id: string, status: 'Pending' | 'Accepted' | 'Rejected'): Promise<demo.DeveloperApplication> {
    const list = readLocal<demo.DeveloperApplication>(KEYS.APPLICATIONS);
    const index = list.findIndex((a) => a.id === id);
    if (index === -1) throw new Error('Application not found');
    list[index].status = status;
    writeLocal(KEYS.APPLICATIONS, list);

    // If accepted, automatically add the developer to the team
    if (status === 'Accepted') {
      const app = list[index];
      const devList = readLocal<demo.Profile>(KEYS.PROFILES);
      const dev = devList.find(p => p.id === app.developer_id);
      const devRole = dev?.bio?.includes('Designer') ? 'UI/UX Designer' : 'Software Developer';
      await this.addTeamMember(app.idea_id, app.developer_id, devRole);
    }

    return list[index];
  },

  // --- NOTIFICATIONS ---
  async getNotifications(userId: string): Promise<demo.Notification[]> {
    const list = readLocal<demo.Notification>(KEYS.NOTIFICATIONS);
    return list.filter((n) => n.user_id === userId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async createNotification(userId: string, title: string, message: string, type: demo.Notification['type']): Promise<demo.Notification> {
    const list = readLocal<demo.Notification>(KEYS.NOTIFICATIONS);
    const newNotif: demo.Notification = {
      id: crypto.randomUUID(),
      user_id: userId,
      title,
      message,
      read: false,
      type,
      created_at: new Date().toISOString(),
    };
    list.unshift(newNotif);
    writeLocal(KEYS.NOTIFICATIONS, list);
    return newNotif;
  },

  async markNotificationRead(id: string): Promise<demo.Notification> {
    const list = readLocal<demo.Notification>(KEYS.NOTIFICATIONS);
    const index = list.findIndex((n) => n.id === id);
    if (index === -1) throw new Error('Notification not found');
    list[index].read = true;
    writeLocal(KEYS.NOTIFICATIONS, list);
    return list[index];
  },
};

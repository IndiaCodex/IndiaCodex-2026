import type { AgentConfig, AgentInstance } from "@/types/agent";
import { AGENT_CONFIGS } from "@/config/agents";

class AgentRegistry {
  private configs: Map<string, AgentConfig> = new Map();
  private instances: Map<string, AgentInstance> = new Map();

  constructor() {
    AGENT_CONFIGS.forEach((config) => {
      this.configs.set(config.id, config);
    });
  }

  getConfig(id: string): AgentConfig | undefined {
    return this.configs.get(id);
  }

  getAllConfigs(): AgentConfig[] {
    return Array.from(this.configs.values());
  }

  getConfigsByRole(role: string): AgentConfig[] {
    return this.getAllConfigs().filter((c) => c.role === role);
  }

  registerInstance(instance: AgentInstance): void {
    this.instances.set(instance.id, instance);
  }

  getInstance(id: string): AgentInstance | undefined {
    return this.instances.get(id);
  }

  getAllInstances(): AgentInstance[] {
    return Array.from(this.instances.values());
  }

  removeInstance(id: string): void {
    this.instances.delete(id);
  }

  clearInstances(): void {
    this.instances.clear();
  }
}

export const agentRegistry = new AgentRegistry();

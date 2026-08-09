import axios from 'axios';
import { Agent } from '../models/Agent';

export interface DecisionResult {
  action: "WORK" | "REST";
  job?: string;
  reason: string;
}

export class LLMService {
  static async generateDecision(agent: Agent, jobList: any[]): Promise<DecisionResult> {
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) throw new Error('NVIDIA_API_KEY is not defined');

    // ── Minimised prompt — fits in ~120 tokens output ────────────
    const jobLines = jobList
      .map(j => `${j.name}(${j.basePay}ADA,${j.risk})`)
      .join('|');

    const lastEvent = agent.history.slice(-1)[0];
    const lastAction = lastEvent ? `last:${lastEvent.type}` : 'new';

    const prompt =
      `You are AI agent "${agent.name}". Personality:${agent.personality}. Balance:${agent.balance}ADA. ${lastAction}. Goal:${agent.goal.slice(0, 60)}.
Jobs: ${jobLines}
Reply ONLY valid JSON: {"action":"WORK"|"REST","job":"job name if WORK","reason":"one sentence"}
Rules: balance<=0=death. ${agent.personality==='aggressive'?'Prefer high-pay jobs.':agent.personality==='conservative'?'Prefer low-risk jobs.':'Balance risk/reward.'}`;

    const requestBody = {
      model: 'minimaxai/minimax-m3',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6,
      max_tokens: 120,   // was 350 — 66% reduction
      stream: false
    };

    console.log(`[LLM] ${agent.name} → requesting decision...`);

    try {
      const response = await axios.post(
        'https://integrate.api.nvidia.com/v1/chat/completions',
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000
        }
      );

      const content = response.data.choices[0]?.message?.content?.trim() || '';

      // Strip markdown code fences if present
      let jsonStr = content
        .replace(/^```json?\s*/i, '')
        .replace(/```\s*$/, '')
        .trim();

      // Extract first {...} block if surrounded by extra text
      const match = jsonStr.match(/\{[\s\S]*\}/);
      if (match) jsonStr = match[0];

      const parsed = JSON.parse(jsonStr);
      return {
        action: parsed.action === 'WORK' ? 'WORK' : 'REST',
        job: parsed.job,
        reason: parsed.reason || ''
      };

    } catch (error: any) {
      console.error(`[LLM] ${agent.name} decision failed: ${error.message}`);
      // Graceful fallback: conservative agents rest, others work cheapest job
      if (agent.personality === 'conservative') {
        return { action: 'REST', reason: 'LLM unavailable — defaulting to rest' };
      }
      const cheapest = jobList.reduce((p, c) => p.basePay < c.basePay ? p : c);
      return { action: 'WORK', job: cheapest.name, reason: 'LLM unavailable — taking safest job' };
    }
  }
}

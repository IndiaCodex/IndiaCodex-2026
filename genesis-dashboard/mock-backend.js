const http = require('http');

let agents = [
  {
    id: 'agent-1',
    name: 'Nexus-7',
    personality: 'Logical and cold',
    goal: 'Accumulate wealth',
    isAlive: true,
    status: 'working',
    adaBalance: 1500,
    stats: { level: 2, experience: 250, health: 100, energy: 80 },
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    diedAt: null
  },
  {
    id: 'agent-2',
    name: 'Sparky',
    personality: 'Chaotic',
    goal: 'Test boundaries',
    isAlive: false,
    status: 'dead',
    adaBalance: 200,
    stats: { level: 1, experience: 50, health: 0, energy: 0 },
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    diedAt: new Date(Date.now() - 400000).toISOString()
  }
];

let events = [
  {
    id: 'evt-1',
    agentId: 'agent-1',
    type: 'spawn',
    message: 'Agent Nexus-7 was spawned.',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'evt-2',
    agentId: 'agent-1',
    type: 'task_complete',
    message: 'Completed data analysis.',
    amount: 1500,
    txHash: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0',
    timestamp: new Date(Date.now() - 86000000).toISOString(),
  },
  {
    id: 'evt-3',
    agentId: 'agent-2',
    type: 'spawn',
    message: 'Agent Sparky was spawned.',
    timestamp: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 'evt-4',
    agentId: 'agent-2',
    type: 'error',
    message: 'Critical failure during execution.',
    timestamp: new Date(Date.now() - 400000).toISOString(),
  },
  {
    id: 'evt-5',
    agentId: 'agent-2',
    type: 'system',
    message: 'Terminated due to lack of ADA.',
    timestamp: new Date(Date.now() - 390000).toISOString(),
  }
];

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Parse body
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    if (req.method === 'GET' && req.url === '/agents') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(agents));
    } else if (req.method === 'GET' && req.url === '/events') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(events));
    } else if (req.method === 'GET' && req.url.startsWith('/agents/')) {
      const id = req.url.split('/')[2];
      const agent = agents.find(a => a.id === id);
      if (agent) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(agent));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
      }
    } else if (req.method === 'POST' && req.url === '/agents') {
      const data = body ? JSON.parse(body) : {};
      const newAgent = {
        id: 'agent-' + (agents.length + 1),
        name: data.name || 'NewAgent',
        personality: data.personality || 'Unknown',
        goal: data.goal || 'Unknown',
        isAlive: true,
        status: 'working',
        adaBalance: 0,
        stats: { level: 1, experience: 0, health: 100, energy: 100 },
        createdAt: new Date().toISOString(),
        diedAt: null
      };
      agents.push(newAgent);

      events.push({
        id: 'evt-' + (events.length + 1),
        agentId: newAgent.id,
        type: 'spawn',
        message: 'Agent ' + newAgent.name + ' was spawned.',
        timestamp: new Date().toISOString(),
      });

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(newAgent));
    } else if (req.method === 'POST' && req.url === '/tick') {
      // Simulate tick
      let worked = 0;
      agents.forEach(a => {
        if (a.isAlive) {
          a.adaBalance += 100;
          worked++;
          events.push({
            id: 'evt-' + (events.length + 1),
            agentId: a.id,
            type: 'tick',
            message: 'Completed routine task.',
            amount: 100,
            timestamp: new Date().toISOString(),
          });
        }
      });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ worked, died: 0 }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  });
});

server.listen(4000, () => {
  console.log('Mock backend running on port 4000');
});

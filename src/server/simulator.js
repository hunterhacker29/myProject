const express = require('express');
const cors = require('cors');
const app = express();

const corsOptions = {
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

const network = {
  nodes: ['A', 'B', 'C', 'D', 'E'],
  links: [
    { from: 'A', to: 'B', capacity: 1000 },
    { from: 'A', to: 'C', capacity: 80 },
    { from: 'B', to: 'D', capacity: 70 },
    { from: 'C', to: 'D', capacity: 90 },
    { from: 'C', to: 'E', capacity: 100 },
    { from: 'D', to: 'E', capacity: 60 }
  ],
  trafficRates: {
    '08:00': { A: 50, B: 30, C: 40, D: 20, E: 60 },
    '08:15': { A: 55, B: 35, C: 45, D: 25, E: 65 },
    '08:30': { A: 60, B: 40, C: 50, D: 30, E: 70 },
    '08:45': { A: 55, B: 35, C: 45, D: 25, E: 65 }
  }
};

let simulation = {
  time: '08:00',
  nodes: {},
  links: JSON.parse(JSON.stringify(network.links)),
  isRunning: false,
  interval: null
};

network.nodes.forEach(node => {
  simulation.nodes[node] = {
    queue: [],
    generated: 0,
    processed: 0,
    dropped: 0
  };
});

function getPath(from, to) {
  if (from === to) return null;
  const queue = [[from]];
  const visited = new Set([from]);
  while (queue.length > 0) {
    const path = queue.shift();
    const node = path[path.length - 1];
    for (const link of network.links) {
      if (link.from === node || link.to === node) {
        const neighbor = link.from === node ? link.to : link.from;
        if (neighbor === to) return [...path, neighbor];
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push([...path, neighbor]);
        }
      }
    }
  }
  return null;
}

function simulateTick() {
  const rates = network.trafficRates[simulation.time];
  network.nodes.forEach(node => {
    const packetCount = rates[node];
    for (let i = 0; i < packetCount; i++) {
      const destinations = network.nodes.filter(n => n !== node);
      const destination = destinations[Math.floor(Math.random() * destinations.length)];
      const path = getPath(node, destination);
      if (path) {
        simulation.nodes[node].queue.push({
          id: `${node}-${Date.now()}-${i}`,
          destination,
          path,
          currentHop: 0
        });
        simulation.nodes[node].generated++;
      }
    }
  });

  network.nodes.forEach(node => {
    const nodeState = simulation.nodes[node];
    const packetsToProcess = [...nodeState.queue];
    nodeState.queue = [];

    packetsToProcess.forEach(packet => {
      if (packet.currentHop >= packet.path.length - 1) {
        nodeState.processed++;
        return;
      }

      const nextNode = packet.path[packet.currentHop + 1];
      const link = simulation.links.find(l =>
        (l.from === node && l.to === nextNode) ||
        (l.to === node && l.from === nextNode)
      );

      if (link && (!link.currentLoad || link.currentLoad < link.capacity)) {
        link.currentLoad = (link.currentLoad || 0) + 1;
        packet.currentHop++;
        simulation.nodes[nextNode].queue.push(packet);
      } else {
        nodeState.queue.push(packet);
        if (nodeState.queue.length > 20) nodeState.dropped++;
      }
    });
  });

  simulation.links.forEach(link => link.currentLoad = 0);
  const times = Object.keys(network.trafficRates);
  simulation.time = times[(times.indexOf(simulation.time) + 1) % times.length];
}

// Helper to strip circular reference before sending
function getSerializableSimulation() {
  const { time, nodes, links, isRunning } = simulation;
  return {
    time,
    nodes,
    links,
    isRunning
  };
}

// API Endpoints
app.get('/api/network', (req, res) => res.json(network));

app.get('/api/state', (req, res) => {
  res.json(getSerializableSimulation());
});

app.post('/api/start', (req, res) => {
  if (!simulation.isRunning) {
    simulation.isRunning = true;
    simulation.interval = setInterval(simulateTick, 1000);
    console.log('Simulation started');
  }
  res.json(getSerializableSimulation());
});

app.post('/api/stop', (req, res) => {
  if (simulation.isRunning) {
    clearInterval(simulation.interval);
    simulation.isRunning = false;
    console.log('Simulation stopped');
  }
  res.json(getSerializableSimulation());
});

app.post('/api/reset', (req, res) => {
  if (simulation.isRunning) {
    clearInterval(simulation.interval);
    simulation.isRunning = false;
  }
  simulation = {
    time: '08:00',
    nodes: {},
    links: JSON.parse(JSON.stringify(network.links)),
    isRunning: false,
    interval: null
  };
  network.nodes.forEach(node => {
    simulation.nodes[node] = {
      queue: [],
      generated: 0,
      processed: 0,
      dropped: 0
    };
  });
  console.log('Simulation reset');
  res.json(getSerializableSimulation());
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

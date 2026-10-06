const net = require('net');

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { host, ports } = req.body;
  if (!host || !ports || !Array.isArray(ports) || ports.length === 0) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  if (ports.length > 50) {
    return res.status(400).json({ error: 'Maximum 50 ports allowed per request' });
  }

  const results = [];

  const checkPort = (port) => {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(2000); // 2 second timeout per port

      socket.on('connect', () => {
        socket.destroy();
        resolve({ port, status: 'open' });
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve({ port, status: 'filtered' });
      });

      socket.on('error', () => {
        socket.destroy();
        resolve({ port, status: 'closed' });
      });

      socket.connect(port, host);
    });
  };

  try {
    // Run concurrently but in chunks if needed, here just map them all
    const scanPromises = ports.map(port => checkPort(port));
    const scanResults = await Promise.all(scanPromises);
    
    return res.status(200).json({ host, results: scanResults });
  } catch (err) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

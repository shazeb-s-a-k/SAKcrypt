const tls = require('tls');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { host } = req.body;
  if (!host) return res.status(400).json({ error: 'Host is required' });

  const checkSSL = () => {
    return new Promise((resolve, reject) => {
      const socket = tls.connect({
        host: host,
        port: 443,
        servername: host,
        rejectUnauthorized: false,
        timeout: 5000
      }, () => {
        const cert = socket.getPeerCertificate(true);
        if (cert && Object.keys(cert).length > 0) {
          resolve({
            subject: cert.subject,
            issuer: cert.issuer,
            valid_from: cert.valid_from,
            valid_to: cert.valid_to,
            fingerprint: cert.fingerprint,
            serialNumber: cert.serialNumber,
            authorized: socket.authorized,
            authorizationError: socket.authorizationError
          });
        } else {
          reject(new Error('No certificate found'));
        }
        socket.destroy();
      });

      socket.on('timeout', () => {
        socket.destroy();
        reject(new Error('Connection timed out'));
      });

      socket.on('error', (err) => {
        socket.destroy();
        reject(err);
      });
    });
  };

  try {
    const certInfo = await checkSSL();
    return res.status(200).json({ host, certificate: certInfo });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to retrieve SSL info' });
  }
}

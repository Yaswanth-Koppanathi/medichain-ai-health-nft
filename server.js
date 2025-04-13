const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const AIDiagnosisService = require('./aiDiagnosisService');
const IPFSCryptoService = require('./ipfsService');
const AptosNFTClient = require('./aptosClient');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));  // Serve your frontend files!

const aiDiagnosis = new AIDiagnosisService(process.env.OPENAI_API_KEY);
const ipfsCrypto = new IPFSCryptoService();
const aptosService = new AptosNFTClient(process.env.APTOS_NODE_URL, process.env.APTOS_FAUCET_URL);

// Health Check
app.get('/health', (req, res) => res.status(200).send('Server is healthy'));

// Analyze Symptoms
app.post('/api/analyze-symptoms', async (req, res) => {
  try {
    const diagnosis = await aiDiagnosis.analyzeSymptoms(req.body);
    res.json(diagnosis);
  } catch (error) {
    console.error('AI Analysis Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Encrypt & Upload to IPFS
app.post('/api/upload-to-ipfs', async (req, res) => {
  try {
    const { diagnosis, publicKey } = req.body;
    if (!diagnosis || !publicKey) return res.status(400).json({ error: 'Missing diagnosis or publicKey' });
    
    const result = await ipfsCrypto.uploadToIPFS(diagnosis, publicKey);
    res.json(result);
  } catch (error) {
    console.error('IPFS Upload Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`✅ MediChain server running on http://localhost:${PORT}`));

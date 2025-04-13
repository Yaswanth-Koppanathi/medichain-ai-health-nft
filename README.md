# MediChain - AI Health Bot + Medical NFTs on Aptos

MediChain combines AI-powered health diagnostics with blockchain technology to create secure, private medical records as NFTs on the Aptos blockchain.

## Features

- AI-powered symptom analysis and preliminary diagnosis
- Secure encryption of medical data
- Storage on IPFS with encryption
- NFT minting on Aptos blockchain for secure record-keeping
- User-friendly interface for entering symptoms and managing records

## Architecture

The application follows a modular architecture with these key components:

1. **Frontend UI**: User interface for symptom input, wallet connection, and NFT management
2. **AI Diagnosis Service**: Analyzes symptoms and generates preliminary diagnoses
3. **IPFS & Encryption Service**: Handles secure storage of medical data
4. **Aptos Integration**: Manages wallet connection and NFT minting

## Workflow

1. User enters symptoms through the interface
2. AI Bot analyzes the symptoms and generates a diagnosis
3. A summary of the diagnosis is generated
4. User reviews and optionally edits the summary
5. Summary is encrypted and uploaded to IPFS
6. User connects their Aptos wallet
7. NFT is minted with metadata linking to the encrypted IPFS data
8. User can view the NFT in their wallet or the app

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- NPM or Yarn
- Aptos CLI (for contract deployment)
- Aptos Wallet (like Petra)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/medichain.git
   cd medichain
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create `.env` file from the sample:
   ```
   cp .env.sample .env
   ```

4. Update the `.env` file with your API keys and configuration

### Deploy the Smart Contract

1. Compile the Move contract:
   ```
   aptos move compile --package-dir contracts/
   ```

2. Publish the contract to Aptos testnet:
   ```
   aptos move publish --package-dir contracts/ --profile testnet
   ```

3. Update the `MEDICHAIN_MODULE_ADDRESS` in your `.env` file with the deployed contract address

### Running the Application

1. Start the backend server:
   ```
   npm run dev
   ```

2. Open `index.html` in a web browser or serve it using a static file server

## Security Considerations

- All medical data is encrypted before being stored on IPFS
- Only the owner of the NFT with the corresponding private key can decrypt and access the data
- The application uses asymmetric encryption to ensure data privacy
- No plaintext medical data is stored on the blockchain

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express
- **AI**: OpenAI GPT-4 for symptom analysis
- **Blockchain**: Aptos for NFT minting and storage
- **Storage**: IPFS for decentralized storage
- **Encryption**: eccrypto for asymmetric encryption

## Future Enhancements

- Multi-language support
- Integration with healthcare providers
- AI-powered health recommendations
- Health data aggregation and analytics (with user consent)
- Appointment scheduling with healthcare providers
- Credential verification for medical professionals

## License

MIT

## Disclaimer

This application provides preliminary health information only and is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
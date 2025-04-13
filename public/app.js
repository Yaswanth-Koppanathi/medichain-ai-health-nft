// app.js
document.addEventListener('DOMContentLoaded', () => {
    const connectWalletBtn = document.getElementById('connect-wallet');
    const walletInfo = document.getElementById('wallet-info');
    const walletAddress = document.getElementById('wallet-address');
    const symptomForm = document.getElementById('symptom-form');
    const analysisLoading = document.getElementById('analysis-loading');
    const symptomsSection = document.getElementById('symptoms-section');
    const diagnosisSection = document.getElementById('diagnosis-section');
    const nftSection = document.getElementById('nft-section');
    const confirmDiagnosisBtn = document.getElementById('confirm-diagnosis');
    const editDiagnosisBtn = document.getElementById('edit-diagnosis');
    const conditionEl = document.getElementById('condition');
    const analysisEl = document.getElementById('analysis');
    const recommendationsEl = document.getElementById('recommendations');
    const ipfsStatusIcon = document.querySelector('#ipfs-status .status-icon');
    const ipfsStatusText = document.querySelector('#ipfs-status .status-text');
    const mintingStatusIcon = document.querySelector('#minting-status .status-icon');
    const mintingStatusText = document.querySelector('#minting-status .status-text');
    const nftResult = document.getElementById('nft-result');
    const nftDate = document.getElementById('nft-date');
    const ipfsHash = document.getElementById('ipfs-hash');
    const txHash = document.getElementById('tx-hash');
    const viewExplorerBtn = document.getElementById('view-explorer');
    const newDiagnosisBtn = document.getElementById('new-diagnosis');

    let currentDiagnosis = null;
    let walletConnected = false;
    let walletProvider = null;
    let userAddress = null;

    async function initAptosWallet() {
        try {
            if (window.aptos) {
                return window.aptos;
            } else {
                alert('Please install the Petra Wallet extension for Aptos');
                return null;
            }
        } catch (error) {
            console.error('Wallet initialization error:', error);
            alert('Failed to initialize wallet connection.');
            return null;
        }
    }

    connectWalletBtn.addEventListener('click', async () => {
        try {
            walletProvider = await initAptosWallet();

            if (walletProvider) {
                const response = await walletProvider.connect();

                if (response.address) {
                    userAddress = response.address;
                    walletConnected = true;
                    walletAddress.textContent = `${userAddress.substring(0, 6)}...${userAddress.substring(userAddress.length - 4)}`;
                    walletInfo.classList.remove('hidden');
                    connectWalletBtn.textContent = 'Wallet Connected';
                    connectWalletBtn.disabled = true;
                }
            }
        } catch (error) {
            console.error('Wallet connection error:', error);
            alert('Failed to connect wallet.');
        }
    });

    // ✅ NEW: Use backend OpenAI service
    async function analyzeSymptoms(symptoms) {
        try {
            const response = await axios.post('/api/analyze-symptoms', symptoms);
            return response.data;
        } catch (error) {
            console.error('Analysis error:', error);
            throw new Error('Failed to analyze symptoms. Please try again later.');
        }
    }

    // ✅ NEW: Use backend to encrypt & upload
    async function uploadToIPFS(data) {
        try {
            // Dummy 64-byte hex public key (replace with real key gen in production)
        const dummyPublicKey = '0491bba2515fbd4c658725377e3e6be510848321f9b8ecb5d49e3db132d7c4c16e6cc91fc77dfd13cc1df405cc9e23e89e748215bfb95c708ec913c2a9448cfbf4';

        const response = await axios.post('/api/upload-to-ipfs', {
        diagnosis: data,
        publicKey: dummyPublicKey
        });

            return response.data.cid;
        } catch (error) {
            console.error('IPFS upload error:', error);
            throw new Error('Failed to upload to IPFS.');
        }
    }

    async function mintNFT(ipfsHash) {
        try {
            if (!walletConnected) throw new Error('Wallet not connected');

            const payload = {
                type: 'entry_function_payload',
                function: '0x1::aptos_token::create_token_script',
                type_arguments: [],
                arguments: [
                    'MediChain Diagnosis',
                    'Medical Record',
                    'AI-generated medical diagnosis',
                    1,
                    1,
                    `https://ipfs.io/ipfs/${ipfsHash}`,
                    userAddress,
                    100,
                    0,
                    [false, false, false, false, false],
                    [],
                    [],
                    [],
                ]
            };

            const response = await walletProvider.signAndSubmitTransaction(payload);
            return { txHash: response.hash, success: true };
        } catch (error) {
            console.error('Minting error:', error);
            throw new Error('Failed to mint NFT.');
        }
    }

    symptomForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const symptomDescription = document.getElementById('symptom-description').value;
        const duration = document.getElementById('duration').value;
        const commonSymptoms = Array.from(document.querySelectorAll('input[name="common-symptoms"]:checked'))
            .map(checkbox => checkbox.value);

        if (!symptomDescription.trim()) {
            alert('Please describe your symptoms.');
            return;
        }

        const symptoms = { description: symptomDescription, duration, commonSymptoms };

        symptomForm.classList.add('hidden');
        analysisLoading.classList.remove('hidden');

        try {
            currentDiagnosis = await analyzeSymptoms(symptoms);
            conditionEl.textContent = currentDiagnosis.condition;
            analysisEl.textContent = currentDiagnosis.analysis;
            recommendationsEl.textContent = currentDiagnosis.recommendations;

            symptomsSection.classList.add('hidden');
            diagnosisSection.classList.remove('hidden');
        } catch (error) {
            alert(error.message);
            symptomForm.classList.remove('hidden');
            analysisLoading.classList.add('hidden');
        }
    });

    editDiagnosisBtn.addEventListener('click', () => {
        diagnosisSection.classList.add('hidden');
        symptomForm.classList.remove('hidden');
        analysisLoading.classList.add('hidden');
        symptomsSection.classList.remove('hidden');
    });

    confirmDiagnosisBtn.addEventListener('click', async () => {
        if (!currentDiagnosis) {
            alert('No diagnosis data available.');
            return;
        }

        if (!walletConnected) {
            alert('Please connect your Aptos wallet first.');
            return;
        }

        diagnosisSection.classList.add('hidden');
        nftSection.classList.remove('hidden');

        try {
            ipfsStatusIcon.textContent = '⏳';
            ipfsStatusText.textContent = 'Encrypting and uploading to IPFS...';

            const hash = await uploadToIPFS(currentDiagnosis);

            ipfsStatusIcon.textContent = '✅';
            ipfsStatusText.textContent = 'Uploaded to IPFS';

            mintingStatusIcon.textContent = '⏳';
            mintingStatusText.textContent = 'Minting NFT...';

            const mintResult = await mintNFT(hash);

            mintingStatusIcon.textContent = '✅';
            mintingStatusText.textContent = 'NFT minted successfully';

            nftDate.textContent = new Date().toLocaleDateString();
            ipfsHash.textContent = `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
            ipfsHash.title = `https://ipfs.io/ipfs/${hash}`;
            ipfsHash.style.cursor = "pointer";
            ipfsHash.onclick = () => window.open(`https://ipfs.io/ipfs/${hash}`, "_blank");
            txHash.textContent = `${mintResult.txHash.substring(0, 6)}...${mintResult.txHash.substring(mintResult.txHash.length - 4)}`;
            

            viewExplorerBtn.addEventListener('click', () => {
                window.open(`https://explorer.aptoslabs.com/txn/${mintResult.txHash}`, '_blank');
            });

            nftResult.classList.remove('hidden');

        } catch (error) {
            alert(error.message);
            nftSection.classList.add('hidden');
            diagnosisSection.classList.remove('hidden');
        }
    });

    newDiagnosisBtn.addEventListener('click', () => {
        symptomForm.reset();
        nftSection.classList.add('hidden');
        symptomForm.classList.remove('hidden');
        analysisLoading.classList.add('hidden');
        symptomsSection.classList.remove('hidden');
        nftResult.classList.add('hidden');
        ipfsStatusIcon.textContent = '⏳';
        mintingStatusIcon.textContent = '⏳';
        ipfsStatusText.textContent = 'Encrypting and uploading to IPFS...';
        mintingStatusText.textContent = 'Minting NFT on Aptos...';
    });
});

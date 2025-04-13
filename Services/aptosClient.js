// aptosClient.js
const { AptosClient, AptosAccount, TokenClient, CoinClient, FaucetClient } = require('aptos');

class AptosNFTClient {
  constructor(nodeUrl, faucetUrl = null) {
    this.client = new AptosClient(nodeUrl);
    this.tokenClient = new TokenClient(this.client);
    this.coinClient = new CoinClient(this.client);
    
    if (faucetUrl) {
      this.faucetClient = new FaucetClient(nodeUrl, faucetUrl);
    }
    
    // MediChain module address - this would be the address where you deployed the module
    this.moduleAddress = process.env.MEDICHAIN_MODULE_ADDRESS || '0x1'; // Default to core framework for example
  }

  /**
   * Create a new account
   * @returns {AptosAccount} New Aptos account
   */
  createAccount() {
    return new AptosAccount();
  }

  /**
   * Get account from private key
   * @param {String} privateKeyHex - Private key in hex format
   * @returns {AptosAccount} Aptos account
   */
  getAccountFromPrivateKey(privateKeyHex) {
    return AptosAccount.fromPrivateKeyHex(privateKeyHex);
  }

  /**
   * Fund account with test tokens (only works on testnet with faucet)
   * @param {AptosAccount|String} account - Account or address to fund
   * @param {Number} amount - Amount to fund in octas
   * @returns {Promise<Array>} Array of transaction hashes
   */
  async fundAccount(account, amount = 100000000) {
    if (!this.faucetClient) {
      throw new Error('Faucet client not initialized');
    }
    
    const address = typeof account === 'string' ? account : account.address().hex();
    return await this.faucetClient.fundAccount(address, amount);
  }

  /**
   * Get account balance
   * @param {String} address - Account address
   * @returns {Promise<BigInt>} Account balance in octas
   */
  async getBalance(address) {
    return await this.coinClient.checkBalance(address);
  }

  /**
   * Create a new collection
   * @param {AptosAccount} account - Account to create collection with
   * @param {String} name - Collection name
   * @param {String} description - Collection description
   * @param {String} uri - Collection URI
   * @returns {Promise<String>} Transaction hash
   */
  async createCollection(account, name, description, uri) {
    const rawTx = await this.tokenClient.createCollectionTransaction(
      account.address(),
      name,
      description,
      uri,
      0, // Maximum supply (0 = unlimited)
      [false, false, false] // Mutable config
    );
    
    const bcsTx = await this.client.generateSignSubmitTransaction(account, rawTx);
    await this.client.waitForTransaction(bcsTx);
    
    return bcsTx;
  }

  /**
   * Create a new token (NFT)
   * @param {AptosAccount} account - Account to create token with
   * @param {String} collectionName - Collection name
   * @param {String} name - Token name
   * @param {String} description - Token description
   * @param {String} uri - Token URI (IPFS link)
   * @returns {Promise<String>} Transaction hash
   */
  async createToken(account, collectionName, name, description, uri) {
    const rawTx = await this.tokenClient.createTokenTransaction(
      account.address(),
      collectionName,
      name,
      description,
      1, // Supply
      uri,
      account.address(), // Royalty payee address
      100, // Royalty denominator
      0, // Royalty numerator (0%)
      [false, false, false, false, false], // Token properties mutable
      [], // Property keys
      [], // Property values
      [], // Property types
    );
    
    const bcsTx = await this.client.generateSignSubmitTransaction(account, rawTx);
    await this.client.waitForTransaction(bcsTx);
    
    return bcsTx;
  }

  /**
   * Mint a medical NFT using the MediChain module
   * @param {AptosAccount} account - Account to mint token with
   * @param {String} tokenName - Token name
   * @param {String} description - Token description
   * @param {String} ipfsHash - IPFS hash of the medical data
   * @returns {Promise<String>} Transaction hash
   */
  async mintMedicalNFT(account, tokenName, description, ipfsHash) {
    const payload = {
      function: `${this.moduleAddress}::medical_nft::mint_medical_nft`,
      type_arguments: [],
      arguments: [
        tokenName,
        description,
        ipfsHash
      ]
    };
    
    const rawTx = await this.client.generateTransaction(account.address(), payload);
    const bcsTx = await this.client.generateSignSubmitTransaction(account, rawTx);
    await this.client.waitForTransaction(bcsTx);
    
    return bcsTx;
  }

  /**
   * Get all tokens owned by an address
   * @param {String} address - Account address
   * @returns {Promise<Array>} Array of tokens
   */
  async getOwnedTokens(address) {
    const tokens = await this.tokenClient.getTokenIdsOwnedByAddress(address);
    
    // Get token data for each token
    const tokenData = [];
    for (const token of tokens) {
      try {
        const data = await this.tokenClient.getTokenData(
          token.token_data_id.creator,
          token.token_data_id.collection,
          token.token_data_id.name
        );
        
        tokenData.push({
          id: token,
          data: data
        });
      } catch (error) {
        console.warn(`Failed to get data for token: ${JSON.stringify(token)}`, error);
      }
    }
    
    return tokenData;
  }

  /**
   * Transfer token to another address
   * @param {AptosAccount} from - Account to transfer from
   * @param {String} to - Address to transfer to
   * @param {String} creator - Token creator address
   * @param {String} collectionName - Collection name
   * @param {String} tokenName - Token name
   * @param {Number} amount - Amount to transfer
   * @returns {Promise<String>} Transaction hash
   */
  async transferToken(from, to, creator, collectionName, tokenName, amount = 1) {
    const rawTx = await this.tokenClient.offerTokenTransaction(
      from.address(),
      to,
      creator,
      collectionName,
      tokenName,
      amount
    );
    
    const bcsTx = await this.client.generateSignSubmitTransaction(from, rawTx);
    await this.client.waitForTransaction(bcsTx);
    
    return bcsTx;
  }

  /**
   * Get transaction details
   * @param {String} txHash - Transaction hash
   * @returns {Promise<Object>} Transaction details
   */
  async getTransaction(txHash) {
    return await this.client.getTransactionByHash(txHash);
  }

  /**
   * Initialize MediChain module
   * @param {AptosAccount} account - Account that deployed the module
   * @returns {Promise<String>} Transaction hash
   */
  async initializeMediChain(account) {
    const payload = {
      function: `${this.moduleAddress}::medical_nft::initialize`,
      type_arguments: [],
      arguments: []
    };
    
    const rawTx = await this.client.generateTransaction(account.address(), payload);
    const bcsTx = await this.client.generateSignSubmitTransaction(account, rawTx);
    await this.client.waitForTransaction(bcsTx);
    
    return bcsTx;
  }

  /**
   * Set up events for MediChain
   * @param {AptosAccount} account - User account
   * @returns {Promise<String>} Transaction hash
   */
  async setupMediChainEvents(account) {
    const payload = {
      function: `${this.moduleAddress}::medical_nft::setup_events`,
      type_arguments: [],
      arguments: []
    };
    
    const rawTx = await this.client.generateTransaction(account.address(), payload);
    const bcsTx = await this.client.generateSignSubmitTransaction(account, rawTx);
    await this.client.waitForTransaction(bcsTx);
    
    return bcsTx;
  }
}

module.exports = AptosNFTClient;
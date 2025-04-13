// ipfsService.js
const crypto = require('crypto');
const { create } = require('ipfs-http-client');
const eccrypto = require('eccrypto');

class IPFSCryptoService {
  constructor(ipfsConfig) {
    this.ipfs = create(ipfsConfig || {
      host: 'ipfs.infura.io',
      port: 5001,
      protocol: 'https'
    });
  }

  /**
   * Generate a new key pair for encryption
   * @returns {Object} Object containing public and private keys
   */
  generateKeyPair() {
    // Generate a new EC key pair
    const privateKey = crypto.randomBytes(32);
    // Get the public key in compressed form
    const publicKey = eccrypto.getPublic(privateKey);
    
    return {
      privateKey: privateKey.toString('hex'),
      publicKey: publicKey.toString('hex')
    };
  }

  /**
   * Encrypt data with a public key
   * @param {Object} data - Data to encrypt
   * @param {Buffer|String} publicKey - Public key to encrypt with
   * @returns {Promise<Object>} Encrypted data
   */
  async encryptWithPublicKey(data, publicKey) {
    try {
      // Convert public key to buffer if it's a string
      if (typeof publicKey === 'string') {
        publicKey = Buffer.from(publicKey, 'hex');
      }
      
      // Convert data to string if it's an object
      const dataStr = typeof data === 'object' ? JSON.stringify(data) : String(data);
      const dataBuffer = Buffer.from(dataStr);
      
      // Encrypt the data
      const encryptedData = await eccrypto.encrypt(publicKey, dataBuffer);
      
      // Convert encrypted data parts to hex strings for easy storage
      return {
        iv: encryptedData.iv.toString('hex'),
        ephemPublicKey: encryptedData.ephemPublicKey.toString('hex'),
        ciphertext: encryptedData.ciphertext.toString('hex'),
        mac: encryptedData.mac.toString('hex')
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error(`Failed to encrypt data: ${error.message}`);
    }
  }

  /**
   * Decrypt data with a private key
   * @param {Object} encryptedData - Encrypted data object
   * @param {Buffer|String} privateKey - Private key to decrypt with
   * @returns {Promise<Object|String>} Decrypted data
   */
  async decryptWithPrivateKey(encryptedData, privateKey) {
    try {
      // Convert private key to buffer if it's a string
      if (typeof privateKey === 'string') {
        privateKey = Buffer.from(privateKey, 'hex');
      }
      
      // Convert encrypted data parts from hex to buffers
      const encryptedBuffer = {
        iv: Buffer.from(encryptedData.iv, 'hex'),
        ephemPublicKey: Buffer.from(encryptedData.ephemPublicKey, 'hex'),
        ciphertext: Buffer.from(encryptedData.ciphertext, 'hex'),
        mac: Buffer.from(encryptedData.mac, 'hex')
      };
      
      // Decrypt the data
      const decryptedBuffer = await eccrypto.decrypt(privateKey, encryptedBuffer);
      const decryptedStr = decryptedBuffer.toString();
      
      // Try to parse as JSON, return as string if not valid JSON
      try {
        return JSON.parse(decryptedStr);
      } catch (e) {
        return decryptedStr;
      }
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error(`Failed to decrypt data: ${error.message}`);
    }
  }

  /**
   * Upload data to IPFS
   * @param {Object|String} data - Data to upload
   * @param {String} [publicKey] - Optional public key to encrypt data with
   * @returns {Promise<Object>} IPFS upload result
   */
  async uploadToIPFS(data, publicKey = null) {
    try {
      let finalData = data;
      
      // Encrypt data if public key is provided
      if (publicKey) {
        finalData = await this.encryptWithPublicKey(data, publicKey);
      }
      
      // Convert to JSON string and then to buffer
      const buffer = Buffer.from(JSON.stringify(finalData));
      
      // Add data to IPFS
      const result = await this.ipfs.add(buffer);
      
      return {
        cid: result.path,
        size: result.size,
        isEncrypted: !!publicKey,
        url: `https://ipfs.io/ipfs/${result.path}`
      };
    } catch (error) {
      console.error('IPFS upload error:', error);
      throw new Error(`Failed to upload to IPFS: ${error.message}`);
    }
  }

  /**
   * Retrieve data from IPFS
   * @param {String} cid - Content identifier (IPFS hash)
   * @param {String} [privateKey] - Optional private key to decrypt data
   * @returns {Promise<Object|String>} Retrieved data
   */
  async getFromIPFS(cid, privateKey = null) {
    try {
      // Get content from IPFS
      const chunks = [];
      for await (const chunk of this.ipfs.cat(cid)) {
        chunks.push(chunk);
      }
      
      // Combine chunks and parse as JSON
      const buffer = Buffer.concat(chunks);
      const contentStr = buffer.toString();
      
      try {
        const content = JSON.parse(contentStr);
        
        // If private key is provided and the content seems to be encrypted, decrypt it
        if (privateKey && content.iv && content.ephemPublicKey && content.ciphertext && content.mac) {
          return await this.decryptWithPrivateKey(content, privateKey);
        }
        
        return content;
      } catch (e) {
        // Return as string if not valid JSON
        return contentStr;
      }
    } catch (error) {
      console.error('IPFS retrieval error:', error);
      throw new Error(`Failed to retrieve from IPFS: ${error.message}`);
    }
  }

  /**
   * Generate a symmetrical encryption key
   * @returns {Object} Object containing key and IV
   */
  generateSymmetricalKey() {
    const key = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);
    
    return {
      key: key.toString('hex'),
      iv: iv.toString('hex')
    };
  }

  /**
   * Encrypt data with a symmetrical key
   * @param {Object|String} data - Data to encrypt
   * @param {Object} symmetricalKey - Key object with key and IV
   * @returns {String} Encrypted data as hex string
   */
  encryptSymmetrical(data, symmetricalKey) {
    try {
      // Convert key and IV from hex to buffers
      const key = Buffer.from(symmetricalKey.key, 'hex');
      const iv = Buffer.from(symmetricalKey.iv, 'hex');
      
      // Convert data to string if it's an object
      const dataStr = typeof data === 'object' ? JSON.stringify(data) : String(data);
      
      // Create cipher and encrypt
      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
      let encrypted = cipher.update(dataStr, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return encrypted;
    } catch (error) {
      console.error('Symmetrical encryption error:', error);
      throw new Error(`Failed to encrypt data symmetrically: ${error.message}`);
    }
  }

  /**
   * Decrypt data with a symmetrical key
   * @param {String} encryptedData - Encrypted data as hex string
   * @param {Object} symmetricalKey - Key object with key and IV
   * @returns {Object|String} Decrypted data
   */
  decryptSymmetrical(encryptedData, symmetricalKey) {
    try {
      // Convert key and IV from hex to buffers
      const key = Buffer.from(symmetricalKey.key, 'hex');
      const iv = Buffer.from(symmetricalKey.iv, 'hex');
      
      // Create decipher and decrypt
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      // Try to parse as JSON, return as string if not valid JSON
      try {
        return JSON.parse(decrypted);
      } catch (e) {
        return decrypted;
      }
    } catch (error) {
      console.error('Symmetrical decryption error:', error);
      throw new Error(`Failed to decrypt data symmetrically: ${error.message}`);
    }
  }
}

module.exports = IPFSCryptoService;
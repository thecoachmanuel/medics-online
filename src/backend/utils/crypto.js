import CryptoJS from 'crypto-js';

// Diffie-Hellman parameters
const prime = 23n;
const generator = 5n;

class DiffieHellman {
  constructor(seed) {
    this.privateKey = this.generatePrivateKey(seed);
    this.publicKey = this.generatePublicKey();
    console.log('🔐 Backend Crypto: Using ' + (seed ? 'deterministic' : 'random') + ' keys');
    console.log('🔐 Backend Crypto: Public key:', this.publicKey);
  }

  generatePrivateKey(seed) {
    if (seed) {
      // Deterministic key generation from seed (for serverless persistence)
      let hash = 0;
      const seedStr = String(seed);
      for (let i = 0; i < seedStr.length; i++) {
        hash = (hash << 5) - hash + seedStr.charCodeAt(i);
        hash |= 0;
      }
      return BigInt(Math.abs(hash) % Number(prime - 1n)) + 1n;
    }
    // Generate a random private key (1 to prime-1)
    return BigInt(Math.floor(Math.random() * (Number(prime) - 1)) + 1);
  }

  generatePublicKey() {
    // Calculate public key: g^privateKey mod p
    return this.modPow(generator, this.privateKey, prime);
  }

  generateSharedSecret(otherPublicKey) {
    // Calculate shared secret: otherPublicKey^privateKey mod p
    const secret = this.modPow(BigInt(otherPublicKey), this.privateKey, prime);
    console.log('🔐 Backend Crypto: Calculating shared secret');
    console.log('🔐 Backend Crypto: Other public key:', otherPublicKey);
    console.log('🔐 Backend Crypto: My private key:', this.privateKey);
    console.log('🔐 Backend Crypto: Prime:', prime);
    console.log('🔐 Backend Crypto: Calculated shared secret:', secret);
    return secret;
  }

  modPow(base, exponent, modulus) {
    // Fast modular exponentiation
    let result = 1n;
    base = base % modulus;
    while (exponent > 0) {
      if (exponent % 2n === 1n) {
        result = (result * base) % modulus;
      }
      exponent = exponent >> 1n;
      base = (base * base) % modulus;
    }
    return result;
  }

  getPublicKey() {
    return this.publicKey.toString();
  }
}

// Encryption and Decryption functions
function encrypt(text, sharedSecret) {
  const key = CryptoJS.SHA256(sharedSecret.toString()).toString();
  console.log('🔐 Backend Crypto: Encrypting with key derived from secret:', sharedSecret);
  console.log('🔐 Backend Crypto: SHA256 key:', key);
  const encrypted = CryptoJS.AES.encrypt(JSON.stringify(text), key).toString();
  console.log('🔐 Backend Crypto: Encrypted result length:', encrypted.length);
  return encrypted;
}

function decrypt(encryptedText, sharedSecret) {
  try {
    const key = CryptoJS.SHA256(sharedSecret.toString()).toString();
    console.log('🔐 Backend Crypto: Decrypting with key derived from secret:', sharedSecret);
    console.log('🔐 Backend Crypto: SHA256 key:', key);
    const bytes = CryptoJS.AES.decrypt(encryptedText, key);
    const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    console.log('🔐 Backend Crypto: Decrypted successfully');
    return decryptedData;
  } catch (error) {
    console.error('❌ Backend Crypto: Decryption failed:', error);
    throw new Error('Decryption failed');
  }
}

export { DiffieHellman, encrypt, decrypt }; 
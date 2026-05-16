import CryptoJS from 'crypto-js';

// Diffie-Hellman parameters (matching backend)
const prime = BigInt('23');
const generator = BigInt('5');

export class DiffieHellman {
  private privateKey: bigint;
  public publicKey: bigint;

  constructor() {
    this.privateKey = this.generatePrivateKey();
    this.publicKey = this.generatePublicKey();
    console.log('🔐 Frontend Crypto: Private key:', this.privateKey);
    console.log('🔐 Frontend Crypto: Public key:', this.publicKey);
  }

  private generatePrivateKey(): bigint {
    // Generate a random private key (1 to prime-1)
    return BigInt(Math.floor(Math.random() * (Number(prime) - 1)) + 1);
  }

  private generatePublicKey(): bigint {
    // Calculate public key: g^privateKey mod p
    return this.modPow(generator, this.privateKey, prime);
  }

  generateSharedSecret(otherPublicKey: string | bigint): bigint {
    // Calculate shared secret: otherPublicKey^privateKey mod p
    const secret = this.modPow(BigInt(otherPublicKey), this.privateKey, prime);
    console.log('🔐 Frontend Crypto: Calculating shared secret');
    console.log('🔐 Frontend Crypto: Other public key:', otherPublicKey);
    console.log('🔐 Frontend Crypto: My private key:', this.privateKey);
    console.log('🔐 Frontend Crypto: Prime:', prime);
    console.log('🔐 Frontend Crypto: Calculated shared secret:', secret);
    return secret;
  }

  private modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
    // Fast modular exponentiation
    let result = BigInt(1);
    base = base % modulus;
    while (exponent > 0) {
      if (exponent % BigInt(2) === BigInt(1)) {
        result = (result * base) % modulus;
      }
      exponent = exponent >> BigInt(1);
      base = (base * base) % modulus;
    }
    return result;
  }

  getPublicKey(): string {
    return this.publicKey.toString();
  }
}

// Encryption and Decryption functions
export function encrypt(text: any, sharedSecret: bigint): string {
  const key = CryptoJS.SHA256(sharedSecret.toString()).toString();
  console.log('🔐 Frontend Crypto: Encrypting with key derived from secret:', sharedSecret);
  console.log('🔐 Frontend Crypto: SHA256 key:', key);
  const encrypted = CryptoJS.AES.encrypt(JSON.stringify(text), key).toString();
  console.log('🔐 Frontend Crypto: Encrypted result length:', encrypted.length);
  return encrypted;
}

export function decrypt(encryptedText: string, sharedSecret: bigint): any {
  try {
    const key = CryptoJS.SHA256(sharedSecret.toString()).toString();
    console.log('🔐 Frontend Crypto: Decrypting with key derived from secret:', sharedSecret);
    console.log('🔐 Frontend Crypto: SHA256 key:', key);
    const bytes = CryptoJS.AES.decrypt(encryptedText, key);
    const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    console.log('🔐 Frontend Crypto: Decrypted successfully');
    return decryptedData;
  } catch (error) {
    const key = CryptoJS.SHA256(sharedSecret.toString()).toString();
    console.error('❌ Frontend Crypto: Decryption failed:', error);
    console.error('   Key used:', key);
    console.error('   Encrypted text (first 100 chars):', encryptedText.substring(0, 100));
    console.error('   Encrypted text length:', encryptedText.length);
    throw new Error('Decryption failed');
  }
} 
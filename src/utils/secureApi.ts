import axios from 'axios';
import { DiffieHellman, encrypt, decrypt } from './crypto';

export interface SecureApiConfig {
  baseURL: string;
  sessionId?: string;
}

class SecureApiService {
  private baseURL: string;
  private sessionId: string;

  constructor(config: SecureApiConfig) {
    this.baseURL = config.baseURL;
    this.sessionId = config.sessionId || this.generateSessionId();
  }

  private generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  async initialize(): Promise<{ dh: DiffieHellman, sharedSecret: bigint, serverPublicKey: string }> {
    try {
      // Always create fresh DH keys for each request
      const dh = new DiffieHellman();
      console.log('🔐 Frontend: DH initialized, client public key:', dh.getPublicKey());

      // Get server's public key (always fresh)
      const response = await axios.get(`${this.baseURL}/api/secure/public-key`, {
        headers: {
          'session-id': this.sessionId,
        },
      });

      if (response.data.success) {
        const serverPublicKey = response.data.serverPublicKey;
        const sharedSecret = dh.generateSharedSecret(serverPublicKey!);
        
        console.log('🔐 Frontend: Secure connection initialized successfully');
        console.log('🔐 Frontend: Session ID:', this.sessionId);
        console.log('🔐 Frontend: Client Public Key:', dh.getPublicKey());
        console.log('🔐 Frontend: Server Public Key:', serverPublicKey);
        console.log('🔐 Frontend: Shared Secret:', sharedSecret);
        
        return { dh, sharedSecret, serverPublicKey };
      } else {
        throw new Error('Failed to get server public key');
      }
    } catch (error) {
      console.error('❌ Frontend: Failed to initialize secure connection:', error);
      throw error;
    }
  }

  async securePost(endpoint: string, data: any): Promise<any> {
    // Always initialize fresh for each request to avoid stale sessions
    const { dh, sharedSecret } = await this.initialize();

    try {
      console.log('🔐 Frontend: Encrypting data for endpoint:', endpoint);
      console.log('🔐 Frontend: Original data:', data);
      
      // Encrypt the data
      const encryptedData = encrypt(data, sharedSecret);
      console.log('🔐 Frontend: Encrypted data:', encryptedData.substring(0, 50) + '...');

      const requestPayload = {
        encrypted: encryptedData,
        clientPublicKey: dh.getPublicKey(),
      };
      
      console.log('🔐 Frontend: Sending request payload:', {
        endpoint,
        sessionId: this.sessionId,
        clientPublicKey: dh.getPublicKey(),
        encryptedLength: encryptedData.length
      });

      // Send encrypted request
      const response = await axios.post(`${this.baseURL}${endpoint}`, requestPayload, {
        headers: {
          'session-id': this.sessionId,
          'Content-Type': 'application/json',
        },
      });

      console.log('🔐 Frontend: Response received:', response.data);

      // Decrypt the response
      if (response.data.encrypted) {
        const decryptedResponse = decrypt(response.data.encrypted, sharedSecret);
        console.log('🔐 Frontend: Decrypted response:', decryptedResponse);
        return decryptedResponse;
      }

      return response.data;
    } catch (error) {
      console.error('❌ Frontend: Secure API call failed:', error);
      throw error;
    }
  }

  async secureGet(endpoint: string): Promise<any> {
    // For GET requests, we'll use a POST with empty data to maintain encryption
    return this.securePost(endpoint, {});
  }

  getSessionInfo() {
    return {
      sessionId: this.sessionId,
      hasSharedSecret: true,
    };
  }
}

// Create a singleton instance
const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
export const secureApi = new SecureApiService({ baseURL: backendUrl });

// Export the class for creating custom instances if needed
export { SecureApiService }; 
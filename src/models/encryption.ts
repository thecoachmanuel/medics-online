export interface MedicalData {
  patientName: string;
  diagnosis: string;
  vitals: {
    bp: string;
    hr: number;
    temp: string;
  };
  timestamp: string;
}

export interface EncryptionStep {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed';
  details?: string;
  apiCall?: string;
  values?: {
    clientPrivateKey?: number;
    clientPublicKey?: number;
    serverPrivateKey?: number;
    serverPublicKey?: number;
    sharedSecret?: number;
    encryptedData?: string;
    decryptedData?: MedicalData;
    prime?: number;
    generator?: number;
    verifyMatch?: boolean;
  };
}
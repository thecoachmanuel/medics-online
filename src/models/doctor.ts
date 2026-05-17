import type { IAppointment } from './appointment';

export interface IDoctorAdmin {
  _id: string;
  image: string;
  name: string;
  speciality: string;
  available: boolean;
  isApproved: boolean;
  isVerified?: boolean;
  kycStatus?: 'not_submitted' | 'pending' | 'approved' | 'rejected';
  kycIdDocument?: string;
  kycLicenseDocument?: string;
  kycRejectionReason?: string;
  workingHoursStart?: string;
  workingHoursEnd?: string;
  workingHours?: { start: string; end: string }[];
  excludedDays?: number[];
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  phone?: string;
}

export interface IPatientAdmin {
  _id: string;
  image: string;
  name: string;
  email: string;
  phone: string;
  address: {
    line1: string;
    line2: string;
  };
  gender: string;
  dob: string;
}

export interface IDashData {
  doctors: number;
  appointments: number;
  patients: number;
  latestAppointments: IAppointment[];
}

export interface IAdminContext {
  aToken: string;
  setAToken: React.Dispatch<React.SetStateAction<string>>;
  doctors: IDoctorAdmin[];
  patients: IPatientAdmin[];
  getAllDoctors: () => Promise<void>;
  getAllPatients: () => Promise<void>;
  changeAvailability: (docId: string) => Promise<void>;
  approveDoctor: (docId: string) => Promise<void>;
  rejectDoctor: (docId: string) => Promise<void>;
  deleteDoctor: (docId: string) => Promise<void>;
  editDoctor: (formData: FormData) => Promise<void>;
  editPatient: (formData: FormData) => Promise<void>;
  appointments: IAppointment[];
  getAllAppointments: () => Promise<void>;
  getDashData: () => Promise<void>;
  cancelAppointment: (appointmentId: string) => Promise<void>;
  dashData: IDashData | null;
  earnings: { total: number; month: number; year: number } | null;
  getEarnings: () => Promise<void>;
}

export interface IDoctorDashData {
  earnings: number;
  commissionRate: number;
  adminCommission: number;
  netShare: number;
  availableBalance: number;
  appointments: number;
  patients: number;
  latestAppointments: IAppointment[];
}

export interface DoctorProfile {
  _id: string;
  name: string;
  email: string;
  image: string;
  degree: string;
  experience: string;
  about: string;
  fees: number;
  address: {
    line1: string;
    line2: string;
  };
  available: boolean;
  speciality: string;
  phone?: string;
  slots_booked?: Record<string, string[]>;
  isApproved?: boolean;
  isVerified?: boolean;
  kycStatus?: 'not_submitted' | 'pending' | 'approved' | 'rejected';
  kycIdDocument?: string;
  kycLicenseDocument?: string;
  kycRejectionReason?: string;
  workingHoursStart?: string;
  workingHoursEnd?: string;
  workingHours?: { start: string; end: string }[];
  excludedDays?: number[];
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
}

export interface IDoctorContext {
  dToken: string;
  setDToken: React.Dispatch<React.SetStateAction<string>>;
  appointments: IAppointment[];
  getAppointments: () => Promise<void>;
  cancelAppointment: (appointmentId: string, cancellationReason?: string, suggestedRebookTime?: string) => Promise<void>;
  completeAppointment: (appointmentId: string) => Promise<void>;
  dashData: IDoctorDashData | null;
  getDashData: () => Promise<void>;
  profileData: DoctorProfile | null;
  setProfileData: React.Dispatch<React.SetStateAction<DoctorProfile | null>>;
  getProfileData: () => Promise<void>;
}
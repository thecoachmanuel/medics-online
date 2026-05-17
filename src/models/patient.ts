export interface IUserAddress {
  line1: string;
  line2: string;
}

export interface IUserData {
  name: string;
  email: string;
  phone: string;
  address: IUserAddress;
  gender: string;
  dob: string;
  image: string;
  _id: string;
}

export interface IDoctorPatient {
  _id: string;
  image: string;
  name: string;
  speciality: string;
  available: boolean;
  slots_booked: Record<string, string[]>;
  degree: string;
  experience: string;
  about: string;
  fees: number;
  averageRating?: number;
  ratingsCount?: number;
  reviews?: Array<{
    userId: string;
    userName: string;
    userImage?: string;
    rating: number;
    comment: string;
    date: number;
  }>;
  isVerified?: boolean;
  kycStatus?: 'not_submitted' | 'pending' | 'approved' | 'rejected';
  kycIdDocument?: string;
  kycLicenseDocument?: string;
  kycRejectionReason?: string;
  workingHoursStart?: string;
  workingHoursEnd?: string;
  workingHours?: { start: string; end: string }[];
  excludedDays?: number[];
  phone?: string;
}

export interface IPatientAppContext {
  token: string;
  setToken: React.Dispatch<React.SetStateAction<string>>;
  backendUrl: string;
  userData: IUserData;
  setUserData: React.Dispatch<React.SetStateAction<IUserData>>;
  loadUserProfileData: () => Promise<void>;
  doctors: IDoctorPatient[];
  currencySymbol: string;
  getDoctosData: () => Promise<void>;
  slotDateFormat: (slotDate: string) => string;
  calculateAge: (dob: string) => number;
}

export type ApiResponse<T> = {
  success: boolean;
  message?: string;
} & T;

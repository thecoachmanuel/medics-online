export interface IUserData {
  image: string;
  name: string;
  dob: string;
}

export interface IDocAddress {
  line1: string;
  line2: string;
}

export interface IDocData {
  _id: string;
  image: string;
  name: string;
  speciality: string;
  address: IDocAddress;
}

export interface IVitals {
  bpm?: number;
  spo2?: number;
}

export interface IAppointment {
  _id: string;
  userData: IUserData;
  docData: IDocData;
  vitals?: IVitals;
  slotDate: string;
  slotTime: string;
  amount: number;
  cancelled?: boolean;
  isCompleted?: boolean;
  payment?: boolean;
  meetingId: string;
  notes?: string;
  prescription?: string;
  cancellationReason?: string;
  suggestedRebookTime?: string;
  cancelledBy?: string;
  isRated?: boolean;
  rating?: number;
  reviewComment?: string;
  commissionRate?: number;
  adminCommission?: number;
  doctorNetShare?: number;
  date: number;
}

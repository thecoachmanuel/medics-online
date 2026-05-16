"use client";

import { createContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { toast } from 'react-toastify';
import { smartApi } from '@/utils/smartApi';
import type { ApiResponse } from '@/models/patient';
import type { IDoctorPatient, IUserData } from '@/models/patient';

export const AppContext = createContext({});

// Define props interface
interface AppContextProviderProps {
  children: ReactNode;
}

const AppContextProvider = (props: AppContextProviderProps) => {
  const currencySymbol = '₦';

  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ];

  // Function to format the date eg. ( 20_01_2000 => 20 Jan 2000 )
  const slotDateFormat = (slotDate: string) => {
    const dateArray = slotDate.split('_');
    return dateArray[0] + ' ' + months[Number(dateArray[1]) - 1] + ' ' + dateArray[2];
  };

  // Function to calculate the age eg. ( 20_01_2000 => 24 )
  const calculateAge = (dob: string) => {
    const today = new Date();
    const birthDate = new Date(dob);
    const age = today.getFullYear() - birthDate.getFullYear();
    return age;
  };

  const [doctors, setDoctors] = useState<IDoctorPatient[]>([]);
  const [token, setToken] = useState('');

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);
  const [userData, setUserData] = useState<IUserData | null>(null);

  // Getting Doctors using API (NOW WITH SMART ENCRYPTION)
  const getDoctosData = async () => {
    try {
      console.log('🏥 Public: Fetching encrypted doctors list');
      const data = await smartApi.get('/api/doctor/list') as ApiResponse<{ doctors: IDoctorPatient[] }>;
      if (data.success) {
        setDoctors(data.doctors);
        console.log('✅ Doctors list loaded via Smart API');
      } else {
        toast.error(data.message);
      }
    } catch (error: unknown) {
      console.log(error);
      if (
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof (error as { message?: unknown }).message === 'string'
      ) {
        toast.error((error as { message: string }).message);
      } else {
        toast.error('An error occurred fetching doctors.');
      }
    }
  };

  // Getting User Profile using API (NOW WITH SMART ENCRYPTION)
  const loadUserProfileData = async () => {
    try {
      const data = await smartApi.get('/api/user/get-profile', {
        headers: { token }
      }) as ApiResponse<{ userData: IUserData }>;

      if (data.success) {
        setUserData(data.userData);
        console.log('✅ User profile loaded via Smart API');
      } else {
        toast.error(data.message);
      }
    } catch (error: unknown) {
      console.log(error);
      if (
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof (error as { message?: unknown }).message === 'string'
      ) {
        toast.error((error as { message: string }).message);
      } else {
        toast.error('An error occurred loading user profile.');
      }
    }
  };

  useEffect(() => {
    getDoctosData();
  }, []);

  useEffect(() => {
    if (token) {
      loadUserProfileData();
    } else {
      setUserData(null);
    }
  }, [token]);

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
  
  const value = {
    doctors,
    getDoctosData,
    token,
    setToken,
    userData,
    setUserData,
    loadUserProfileData,
    currencySymbol,
    slotDateFormat,
    calculateAge,
    backendUrl
  };

  return <AppContext.Provider value={value}>{props.children}</AppContext.Provider>;
};

export default AppContextProvider;

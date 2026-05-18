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

  const [userData, setUserData] = useState<IUserData | null>(null);

  const [cmsData, setCmsData] = useState<any>({
    homeHeaderTitle: 'Connect with Trusted Doctors Online',
    homeHeaderSubtitle: 'Book appointments, consult via video, and manage your healthcare journey all in one secure platform',
    homeHeaderImage: '/assets/header_img.webp',
    homeHeaderBtnText: 'Find Doctors',
    homeHeaderBtnLink: '/doctors',

    aboutTitle: 'ABOUT US',
    aboutImage: '/assets/about_image.webp',
    aboutText1: 'Welcome to MedicsOnline, your trusted partner in managing your healthcare needs conveniently and efficiently. At MedicsOnline, we understand the challenges individuals face when it comes to scheduling doctor appointments and managing their health records.',
    aboutText2: 'MedicsOnline is committed to excellence in healthcare technology. We continuously strive to enhance our platform, integrating the latest advancements to improve user experience and deliver superior service. Whether you\'re booking your first appointment or managing ongoing care, MedicsOnline is here to support you every step of the way.',
    aboutVisionTitle: 'Our Vision',
    aboutVisionText: 'Our vision at MedicsOnline is to create a seamless healthcare experience for every user. We aim to bridge the gap between patients and healthcare providers, making it easier for you to access the care you need, when you need it.',

    chooseUsTitle: 'WHY CHOOSE US',
    chooseUsEfficiencyTitle: 'EFFICIENCY:',
    chooseUsEfficiencyText: 'Streamlined appointment scheduling that fits into your busy lifestyle.',
    chooseUsConvenienceTitle: 'CONVENIENCE:',
    chooseUsConvenienceText: 'Access to a network of trusted healthcare professionals in your area.',
    chooseUsPersonalizationTitle: 'PERSONALIZATION:',
    chooseUsPersonalizationText: 'Tailored recommendations and reminders to help you stay on top of your health.',

    contactTitle: 'CONTACT US',
    contactImage: '/assets/contact_image.webp',
    contactOfficeTitle: 'OUR OFFICE',
    contactAddress: 'Lagos\nNigeria',
    contactPhone: '+234-703-858-7375',
    contactEmail: 'medicsonlineng@gmail.com',
    contactCareerTitle: 'CAREERS AT MedicsOnline',
    contactCareerText: 'Learn more about our teams and job openings.',
    contactExploreBtnText: 'Explore Jobs'
  });

  const loadCmsData = async () => {
    try {
      const data = await smartApi.post('/api/cms/get', {}) as any;
      if (data.success && data.cms) {
        setCmsData(data.cms);
      }
    } catch (error) {
      console.log('Error loading CMS data:', error);
    }
  };

  useEffect(() => {
    loadCmsData();
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      try {
        setUserData(JSON.parse(storedUserData));
      } catch (e) {
        localStorage.removeItem('userData');
      }
    }
    const storedDoctors = localStorage.getItem('doctors');
    if (storedDoctors) {
      try {
        setDoctors(JSON.parse(storedDoctors));
      } catch (e) {
        localStorage.removeItem('doctors');
      }
    }
  }, []);

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
        if (data.message === 'Account not found or deleted' || data.message === 'User not found') {
          setToken('');
          localStorage.removeItem('token');
          setUserData(null);
        }
      }
    } catch (error: unknown) {
      console.log(error);
      const msg = error && typeof error === 'object' && 'message' in error ? (error as any).message : '';
      if (msg === 'Account not found or deleted' || msg === 'User not found') {
        setToken('');
        localStorage.removeItem('token');
        setUserData(null);
      }
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
    if (userData) {
      localStorage.setItem('userData', JSON.stringify(userData));
    } else if (!token) {
      localStorage.removeItem('userData');
    }
  }, [userData, token]);

  useEffect(() => {
    if (doctors && doctors.length > 0) {
      localStorage.setItem('doctors', JSON.stringify(doctors));
    }
  }, [doctors]);

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
    backendUrl,
    cmsData,
    loadCmsData
  };

  return <AppContext.Provider value={value}>{props.children}</AppContext.Provider>;
};

export default AppContextProvider;

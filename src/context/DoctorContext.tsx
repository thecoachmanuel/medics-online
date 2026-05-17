"use client";

import { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { toast } from 'react-toastify';

import type { IDoctorContext, DoctorProfile } from '@/models/doctor';
import { smartApi } from '@/utils/smartApi';
import type { ApiResponse } from '@/models/patient';

export const DoctorContext = createContext({} as IDoctorContext);

interface DoctorContextProviderProps {
  children: ReactNode;
}

const DoctorContextProvider = (props: DoctorContextProviderProps) => {
  const [dToken, setDToken] = useState('');
  const [appointments, setAppointments] = useState<IDoctorContext['appointments']>([]);
  const [dashData, setDashData] = useState<IDoctorContext['dashData']>(null);
  const [profileData, setProfileData] = useState<DoctorProfile | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('dToken');
    if (storedToken) {
      setDToken(storedToken);
    }
    const storedProfileData = localStorage.getItem('doctorProfileData');
    if (storedProfileData) {
      try {
        setProfileData(JSON.parse(storedProfileData));
      } catch (e) {
        localStorage.removeItem('doctorProfileData');
      }
    }
    const storedDashData = localStorage.getItem('doctorDashData');
    if (storedDashData) {
      try {
        setDashData(JSON.parse(storedDashData));
      } catch (e) {
        localStorage.removeItem('doctorDashData');
      }
    }
    const storedAppointments = localStorage.getItem('doctorAppointments');
    if (storedAppointments) {
      try {
        setAppointments(JSON.parse(storedAppointments));
      } catch (e) {
        localStorage.removeItem('doctorAppointments');
      }
    }
  }, []);

  useEffect(() => {
    if (profileData) {
      localStorage.setItem('doctorProfileData', JSON.stringify(profileData));
    } else if (!dToken) {
      localStorage.removeItem('doctorProfileData');
    }
    
    if (dashData) {
      localStorage.setItem('doctorDashData', JSON.stringify(dashData));
    } else if (!dToken) {
      localStorage.removeItem('doctorDashData');
    }

    if (appointments && appointments.length > 0) {
      localStorage.setItem('doctorAppointments', JSON.stringify(appointments));
    } else if (!dToken) {
      localStorage.removeItem('doctorAppointments');
    }
  }, [profileData, dashData, appointments, dToken]);

  const loadDoctorData = async () => {
    if (dToken) {
      await Promise.all([
        getProfileData(),
        getAppointments(),
        getDashData()
      ]);
    } else {
      setProfileData(null);
      setAppointments([]);
      setDashData(null);
    }
  };

  // Trigger data loading when dToken changes
  useEffect(() => {
    loadDoctorData();
  }, [dToken]);

  // Getting Doctor appointment data from Database using API
  const getAppointments = async () => {
    try {
      console.log('🩺 Doctor Portal: Fetching encrypted appointments');
      const data = await smartApi.get('/api/doctor/appointments', {
        headers: { dToken }
      }) as ApiResponse<{ appointments: IDoctorContext['appointments'] }>;

      if (data.success) {
        setAppointments(data.appointments.reverse());
        console.log('\u2705 Doctor appointments loaded via Smart API');
      } else {
        toast.error(data.message || 'Failed to load appointments');
      }
    } catch (error: unknown) {
      console.error('❌ Doctor appointments loading error:', error);
      if (
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof (error as { message?: unknown }).message === 'string'
      ) {
        toast.error((error as { message: string }).message);
      } else {
        toast.error('An error occurred while loading appointments');
      }
    }
  };

  // Getting Doctor profile data from Database using API
  const getProfileData = async () => {
    try {
      console.log('🩺 Doctor Portal: Fetching encrypted profile');
      const data = await smartApi.get('/api/doctor/profile', { 
        headers: { dToken } 
      }) as ApiResponse<{ profileData: DoctorProfile }>;
      
      setProfileData(data.profileData);
      console.log('\u2705 Doctor profile loaded via Smart API');
    } catch (error: unknown) {
      console.error('❌ Doctor profile loading error:', error);
      if (
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof (error as { message?: unknown }).message === 'string'
      ) {
        toast.error((error as { message: string }).message);
      } else {
        toast.error('An error occurred while loading profile');
      }
    }
  };

  // Function to cancel doctor appointment using API (NOW WITH SMART ENCRYPTION)
  const cancelAppointment = async (appointmentId: string, cancellationReason?: string, suggestedRebookTime?: string) => {
    try {
      console.log('🩺 Doctor: Cancelling appointment with encryption');
      const data = await smartApi.post('/api/doctor/cancel-appointment', 
        { appointmentId, cancellationReason, suggestedRebookTime },
        { headers: { dToken } }
      ) as ApiResponse<object>;

      if (data.success) {
        toast.success(data.message);
        getAppointments();
        getDashData();
        console.log('✅ Appointment cancelled via Smart API');
      } else {
        toast.error(data.message);
      }
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof (error as { message?: unknown }).message === 'string'
      ) {
        toast.error((error as { message: string }).message);
      } else {
        toast.error('An error occurred');
      }
      console.log(error);
    }
  };

  // Function to Mark appointment accepted using API (NOW WITH SMART ENCRYPTION)
  const completeAppointment = async (appointmentId: string) => {
    try {
      console.log('🩺 Doctor: Completing appointment with encryption');
      const data = await smartApi.post('/api/doctor/complete-appointment',
        { appointmentId },
        { headers: { dToken } }
      ) as ApiResponse<object>;

      if (data.success) {
        toast.success(data.message);
        getAppointments();
        getDashData();
        console.log('✅ Appointment completed via Smart API');
      } else {
        toast.error(data.message);
      }
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof (error as { message?: unknown }).message === 'string'
      ) {
        toast.error((error as { message: string }).message);
      } else {
        toast.error('An error occurred');
      }
      console.log(error);
    }
  };

  // Getting Doctor dashboard data using API
  const getDashData = async () => {
    try {
      console.log('🩺 Doctor Portal: Fetching encrypted dashboard data');
      const data = await smartApi.get('/api/doctor/dashboard', {
        headers: { dToken }
      }) as ApiResponse<{ dashData: IDoctorContext['dashData'] }>;

      if (data.success) {
        setDashData(data.dashData);
        console.log('\u2705 Doctor dashboard loaded via Smart API');
      } else {
        toast.error(data.message || 'Failed to load dashboard');
      }
    } catch (error: unknown) {
      console.error('❌ Doctor dashboard loading error:', error);
      if (
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof (error as { message?: unknown }).message === 'string'
      ) {
        toast.error((error as { message: string }).message);
      } else {
        toast.error('An error occurred while loading dashboard');
      }
    }
  };

  const value: IDoctorContext = {
    dToken,
    setDToken,
    appointments,
    getAppointments,
    cancelAppointment,
    completeAppointment,
    dashData,
    getDashData,
    profileData,
    setProfileData,
    getProfileData
  };

  return <DoctorContext.Provider value={value}>{props.children}</DoctorContext.Provider>;
};

export default DoctorContextProvider;

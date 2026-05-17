"use client";

import { createContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import type { ReactNode } from 'react';

import type { IAdminContext } from '@/models/doctor';
import { smartApi } from '@/utils/smartApi';
import type { ApiResponse } from '@/models/patient';

export const AdminContext = createContext({} as IAdminContext);

interface AdminContextProviderProps {
  children: ReactNode;
}

const AdminContextProvider = (props: AdminContextProviderProps) => {
  const [aToken, setAToken] = useState('');

  const [appointments, setAppointments] = useState<IAdminContext['appointments']>([]);
  const [doctors, setDoctors] = useState<IAdminContext['doctors']>([]);
  const [patients, setPatients] = useState<IAdminContext['patients']>([]);
  const [dashData, setDashData] = useState<IAdminContext['dashData']>(null);
  const [earnings, setEarnings] = useState<IAdminContext['earnings']>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('aToken');
    if (storedToken) {
      setAToken(storedToken);
    }
    const storedDashData = localStorage.getItem('adminDashData');
    if (storedDashData) {
      try {
        setDashData(JSON.parse(storedDashData));
      } catch (e) {
        localStorage.removeItem('adminDashData');
      }
    }
  }, []);

  useEffect(() => {
    if (dashData) {
      localStorage.setItem('adminDashData', JSON.stringify(dashData));
    }
  }, [dashData]);

  const loadAdminData = async () => {
    if (aToken) {
      await Promise.all([
        getAllDoctors(),
        getAllPatients(),
        getAllAppointments(),
        getDashData(),
        getEarnings()
      ]);
    } else {
      setDoctors([]);
      setPatients([]);
      setAppointments([]);
      setDashData(null);
      setEarnings(null);
    }
  };

  // Trigger data loading when aToken changes
  useEffect(() => {
    loadAdminData();
  }, [aToken]);

  // Getting all Doctors data from Database using API
  const getAllDoctors = async () => {
    try {
      console.log('🏥 Admin Portal: Fetching encrypted all-doctors');
      const data = await smartApi.get('/api/admin/all-doctors', {
        headers: { aToken }
      }) as ApiResponse<{ doctors: IAdminContext['doctors'] }>;
      if (data.success) {
        setDoctors(data.doctors);
        console.log('\u2705 All doctors loaded via Smart API');
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
    }
  };

  // Function to change doctor availablity using API (NOW WITH SMART ENCRYPTION)
  const changeAvailability = async (docId: string) => {
    try {
      console.log('🔥 CHECKBOX CLICKED! Doctor ID:', docId);
      console.log('🏥 Admin: Changing doctor availability with encryption');
      const data = await smartApi.post('/api/admin/change-availability',
        { docId },
        { headers: { aToken } }
      ) as ApiResponse<object>;
      if (data.success) {
        toast.success(data.message);
        getAllDoctors();
        console.log('✅ Doctor availability changed via Smart API');
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
        toast.error('An error occurred');
      }
    }
  };

  // Function to approve doctor using API (NOW WITH SMART ENCRYPTION)
  const approveDoctor = async (docId: string) => {
    try {
      console.log('✅ APPROVE BUTTON CLICKED! Doctor ID:', docId);
      console.log('🏥 Admin: Approving doctor with encryption');
      const data = await smartApi.post('/api/admin/approve-doctor',
        { docId },
        { headers: { aToken } }
      ) as ApiResponse<object>;
      if (data.success) {
        toast.success(data.message);
        getAllDoctors();
        console.log('✅ Doctor approved via Smart API');
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
        toast.error('An error occurred');
      }
    }
  };

  // Function to reject doctor using API (NOW WITH SMART ENCRYPTION)
  const rejectDoctor = async (docId: string) => {
    try {
      console.log('❌ REJECT BUTTON CLICKED! Doctor ID:', docId);
      console.log('🏥 Admin: Rejecting doctor with encryption');
      const data = await smartApi.post('/api/admin/reject-doctor',
        { docId },
        { headers: { aToken } }
      ) as ApiResponse<object>;
      if (data.success) {
        toast.success(data.message);
        getAllDoctors();
        console.log('✅ Doctor rejected via Smart API');
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
        toast.error('An error occurred');
      }
    }
  };

  const deleteDoctor = async (docId: string) => {
    try {
      const data = await smartApi.post('/api/admin/delete-doctor',
        { docId },
        { headers: { aToken } }
      ) as ApiResponse<object>;
      if (data.success) {
        toast.success(data.message);
        getAllDoctors();
      } else {
        toast.error(data.message);
      }
    } catch (error: unknown) {
      console.log(error);
      toast.error('An error occurred while deleting doctor');
    }
  };

  const editDoctor = async (formData: FormData) => {
    try {
      const data = await smartApi.post('/api/admin/edit-doctor',
        formData,
        { headers: { aToken } }
      ) as ApiResponse<object>;
      if (data.success) {
        toast.success(data.message);
        getAllDoctors();
      } else {
        toast.error(data.message);
      }
    } catch (error: unknown) {
      console.log(error);
      toast.error('An error occurred while editing doctor');
    }
  };

  // Function to edit patient using API (NOW WITH SMART ENCRYPTION)
  const editPatient = async (formData: FormData) => {
    try {
      const data = await smartApi.post('/api/admin/edit-patient',
        formData,
        { headers: { aToken } }
      ) as ApiResponse<object>;
      if (data.success) {
        toast.success(data.message);
        getAllPatients();
      } else {
        toast.error(data.message);
      }
    } catch (error: unknown) {
      console.log(error);
      toast.error('An error occurred while editing patient');
    }
  };

  // Getting all appointment data from Database using API
  const getAllAppointments = async () => {
    try {
      console.log('🏥 Admin Portal: Fetching encrypted appointments');
      const data = await smartApi.get('/api/admin/appointments', {
        headers: { aToken }
      }) as ApiResponse<{ appointments: IAdminContext['appointments'] }>;
      if (data.success) {
        setAppointments(data.appointments.reverse());
        console.log('\u2705 All appointments loaded via Smart API');
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

  // Function to cancel appointment using API (NOW WITH SMART ENCRYPTION)
  const cancelAppointment = async (appointmentId: string) => {
    try {
      console.log('🏥 Admin: Cancelling appointment with encryption');
      const data = await smartApi.post('/api/admin/cancel-appointment',
        { appointmentId },
        { headers: { aToken } }
      ) as ApiResponse<object>;

      if (data.success) {
        toast.success(data.message);
        getAllAppointments();
        console.log('✅ Admin appointment cancelled via Smart API');
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

  // Getting all Patients data from Database using API
  const getAllPatients = async () => {
    try {
      console.log('🏥 Admin Portal: Fetching encrypted all-patients');
      const data = await smartApi.get('/api/admin/all-patients', {
        headers: { aToken }
      }) as ApiResponse<{ patients: IAdminContext['patients'] }>;
      if (data.success) {
        setPatients(data.patients);
        console.log('\u2705 All patients loaded via Smart API');
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
    }
  };

  // Getting Admin Dashboard data from Database using API
  const getDashData = async () => {
    try {
      console.log('🏥 Admin Portal: Fetching encrypted dashboard');
      const data = await smartApi.get('/api/admin/dashboard', {
        headers: { aToken }
      }) as ApiResponse<{ dashData: IAdminContext['dashData'] }>;

      if (data.success) {
        setDashData(data.dashData);
        console.log('\u2705 Admin dashboard loaded via Smart API');
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
        toast.error('An error occurred');
      }
    }
  };

  const getEarnings = async () => {
    try {
      console.log('🏥 Admin Portal: Fetching earnings');
      const data = await smartApi.get('/api/admin/earnings', {
        headers: { aToken }
      }) as ApiResponse<{ earnings: IAdminContext['earnings'] }>;
      if (data.success) {
        setEarnings(data.earnings);
        console.log('\u2705 Earnings loaded via Smart API');
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
    }
  };

  const value = {
    aToken,
    setAToken,
    doctors,
    patients,
    getAllDoctors,
    getAllPatients,
    changeAvailability,
    approveDoctor,
    rejectDoctor,
    appointments,
    getAllAppointments,
    getDashData,
    cancelAppointment,
    deleteDoctor,
    editDoctor,
    editPatient,
    dashData,
    earnings,
    getEarnings
  };

  return <AdminContext.Provider value={value}>{props.children}</AdminContext.Provider>;
};

export default AdminContextProvider;
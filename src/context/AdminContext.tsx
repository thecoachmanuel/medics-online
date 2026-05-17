"use client";

import { createContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import type { ReactNode } from 'react';

import type { IAdminContext, IRbacAdmin } from '@/models/doctor';
import { smartApi } from '@/utils/smartApi';
import type { ApiResponse } from '@/models/patient';

export const AdminContext = createContext({} as IAdminContext);

interface AdminContextProviderProps {
  children: ReactNode;
}

const AdminContextProvider = (props: AdminContextProviderProps) => {
  const [aToken, setAToken] = useState('');
  const [adminProfile, setAdminProfile] = useState<any>(null);

  const [appointments, setAppointments] = useState<IAdminContext['appointments']>([]);
  const [doctors, setDoctors] = useState<IAdminContext['doctors']>([]);
  const [patients, setPatients] = useState<IAdminContext['patients']>([]);
  const [dashData, setDashData] = useState<IAdminContext['dashData']>(null);
  const [earnings, setEarnings] = useState<IAdminContext['earnings']>(null);
  const [admins, setAdmins] = useState<IRbacAdmin[]>([]);

  useEffect(() => {
    const storedToken = localStorage.getItem('aToken');
    if (storedToken) {
      setAToken(storedToken);
    }
    const storedProfile = localStorage.getItem('adminProfile');
    if (storedProfile) {
      try {
        setAdminProfile(JSON.parse(storedProfile));
      } catch (e) {
        localStorage.removeItem('adminProfile');
      }
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

  const getAdminProfileData = async () => {
    try {
      if (!aToken) return null;
      console.log('🏥 Admin Portal: Fetching encrypted admin profile');
      const data = await smartApi.get('/api/admin/profile', {
        headers: { aToken }
      }) as any;
      if (data.success && data.admin) {
        setAdminProfile(data.admin);
        localStorage.setItem('adminProfile', JSON.stringify(data.admin));
        return data.admin;
      }
    } catch (error) {
      console.error('Failed to load admin profile:', error);
    }
    return null;
  };

  const loadAdminData = async () => {
    if (aToken) {
      // 1. Sync/fetch the admin profile permissions matrix first
      const profile = await getAdminProfileData();
      const permissions = profile?.permissions;
      const isMaster = profile?.role === 'master';

      const loaders: Promise<any>[] = [];

      // 2. Conditionally invoke loaders based on permissions
      if (isMaster || permissions?.doctors !== false) {
        loaders.push(getAllDoctors());
      } else {
        setDoctors([]);
      }

      if (isMaster || permissions?.patients !== false) {
        loaders.push(getAllPatients());
      } else {
        setPatients([]);
      }

      if (isMaster || permissions?.appointments !== false) {
        loaders.push(getAllAppointments());
      } else {
        setAppointments([]);
      }

      if (isMaster || permissions?.dashboard !== false) {
        loaders.push(getDashData());
        loaders.push(getEarnings());
      } else {
        setDashData(null);
        setEarnings(null);
      }

      if (isMaster || permissions?.settings !== false) {
        loaders.push(getCmsData());
      } else {
        setCmsData(null);
      }

      if (isMaster) {
        loaders.push(getAllAdmins());
      } else {
        setAdmins([]);
      }

      if (loaders.length > 0) {
        await Promise.all(loaders);
      }
    } else {
      setDoctors([]);
      setPatients([]);
      setAppointments([]);
      setDashData(null);
      setEarnings(null);
      setCmsData(null);
      setAdmins([]);
      setAdminProfile(null);
      localStorage.removeItem('adminProfile');
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

  const getEmailTemplates = async () => {
    try {
      const data = await smartApi.get('/api/admin/get-email-templates', {
        headers: { aToken }
      }) as any;
      if (data.success) {
        return data.templates;
      } else {
        toast.error(data.message);
        return [];
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch email templates');
      return [];
    }
  };

  const updateEmailTemplate = async (templateId: string, subject: string, body: string) => {
    try {
      const data = await smartApi.post('/api/admin/update-email-template', 
        { templateId, subject, body },
        { headers: { aToken } }
      ) as any;
      if (data.success) {
        toast.success(data.message || 'Email template updated successfully');
        return true;
      } else {
        toast.error(data.message);
        return false;
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update email template');
      return false;
    }
  };

  const [cmsData, setCmsData] = useState<any>(null);

  const getCmsData = async () => {
    try {
      const data = await smartApi.post('/api/cms/get', {}) as any;
      if (data.success && data.cms) {
        setCmsData(data.cms);
        return data.cms;
      }
      return null;
    } catch (error) {
      console.log('Error loading CMS data:', error);
      return null;
    }
  };

  const updateCmsData = async (data: any) => {
    try {
      const res = await smartApi.post('/api/admin/update-cms', data, {
        headers: { aToken }
      }) as any;
      if (res.success) {
        toast.success(res.message || 'CMS updated successfully');
        setCmsData(res.cms);
        return true;
      } else {
        toast.error(res.message || 'Failed to update CMS');
        return false;
      }
    } catch (error: any) {
      toast.error(error.message || 'Error updating CMS');
      return false;
    }
  };

  const sendBulkEmail = async (params: any) => {
    try {
      const res = await smartApi.post('/api/admin/send-bulk-email', params, {
        headers: { aToken }
      }) as any;
      if (res.success) {
        toast.success(res.message || 'Bulk email broadcast complete');
        return true;
      } else {
        toast.error(res.message || 'Failed to send bulk email');
        return false;
      }
    } catch (error: any) {
      toast.error(error.message || 'Error sending bulk email');
      return false;
    }
  };

  const sendAppointmentReminders = async () => {
    try {
      const data = await smartApi.post('/api/admin/send-appointment-reminders', 
      {},
      { headers: { aToken } }
    ) as any;
    if (data.success) {
      toast.success(data.message || 'Reminders sent successfully');
      return true;
    } else {
      toast.error(data.message);
      return false;
    }
  } catch (error: any) {
    toast.error(error.message || 'Failed to send reminders');
    return false;
  }
};

  const getAllAdmins = async () => {
    try {
      const data = await smartApi.post('/api/admin/get-admins', {}, {
        headers: { aToken }
      }) as any;
      if (data.success) {
        setAdmins(data.admins);
      }
    } catch (error: any) {
      console.error('Error fetching admins:', error);
    }
  };

  const createAdminStaff = async (adminData: any) => {
    try {
      const data = await smartApi.post('/api/admin/create-admin', adminData, {
        headers: { aToken }
      }) as any;
      if (data.success) {
        toast.success(data.message || 'Staff Admin created successfully');
        await getAllAdmins();
        return true;
      } else {
        toast.error(data.message || 'Failed to create staff admin');
        return false;
      }
    } catch (error: any) {
      toast.error(error.message || 'Error creating staff admin');
      return false;
    }
  };

  const updateAdminStaff = async (adminId: string, permissions?: any, isActive?: boolean) => {
    try {
      const data = await smartApi.post('/api/admin/update-admin', { adminId, permissions, isActive }, {
        headers: { aToken }
      }) as any;
      if (data.success) {
        toast.success(data.message || 'Permissions updated successfully');
        await getAllAdmins();
        return true;
      } else {
        toast.error(data.message || 'Failed to update permissions');
        return false;
      }
    } catch (error: any) {
      toast.error(error.message || 'Error updating staff admin');
      return false;
    }
  };

  const deleteAdminStaff = async (adminId: string) => {
    try {
      const data = await smartApi.post('/api/admin/delete-admin', { adminId }, {
        headers: { aToken }
      }) as any;
      if (data.success) {
        toast.success(data.message || 'Staff Admin removed successfully');
        await getAllAdmins();
        return true;
      } else {
        toast.error(data.message || 'Failed to remove staff admin');
        return false;
      }
    } catch (error: any) {
      toast.error(error.message || 'Error removing staff admin');
      return false;
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
    getEarnings,
    getEmailTemplates,
    updateEmailTemplate,
    sendAppointmentReminders,
    cmsData,
    getCmsData,
    updateCmsData,
    sendBulkEmail,
    admins,
    getAllAdmins,
    createAdminStaff,
    updateAdminStaff,
    deleteAdminStaff,
    adminProfile,
    setAdminProfile,
    getAdminProfileData
  };

  return <AdminContext.Provider value={value}>{props.children}</AdminContext.Provider>;
};

export default AdminContextProvider;
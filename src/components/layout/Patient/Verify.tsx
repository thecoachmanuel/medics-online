"use client";

import { useContext, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';

import { AppContext } from '@/context/AppContext';
import { smartApi } from '@/utils/smartApi';
import type { IPatientAppContext } from '@/models/patient';

const Verify = () => {
  const searchParams = useSearchParams();

  const { token } = useContext(AppContext) as IPatientAppContext;

  const router = useRouter();

  // Function to verify Paystack payment
  const verifyPaystack = async () => {
    try {
      // Get the reference from URL parameters
      const reference = searchParams?.get('reference');
      
      if (!reference) {
        toast.error('Payment reference not found');
        router.push('/my-appointments');
        return;
      }

      const data: any = await smartApi.post('/api/user/verify-paystack',
        { reference },
        { headers: { token } }
      );

      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }

      router.push('/my-appointments');
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

  useEffect(() => {
    if (token) {
      verifyPaystack();
    }
  }, [token]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-20 h-20 border-4 border-gray-300 border-t-4 border-t-primary rounded-full animate-spin"></div>
    </div>
  );
};

export default Verify;

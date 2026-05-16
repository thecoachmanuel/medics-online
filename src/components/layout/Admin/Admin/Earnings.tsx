"use client";

import { useContext, useEffect } from 'react';
import { AdminContext } from '@/context/AdminContext';
import type { IAdminContext } from '@/models/doctor';
import { toast } from 'react-toastify';

const Earnings = () => {
  const { earnings, getEarnings } = useContext(AdminContext) as IAdminContext;

  useEffect(() => {
    if (getEarnings) {
      getEarnings().catch((error: unknown) => {
        if (
          error &&
          typeof error === 'object' &&
          'message' in error &&
          typeof (error as { message?: unknown }).message === 'string'
        ) {
          toast.error((error as { message: string }).message);
        } else {
          toast.error('Failed to load earnings');
        }
      });
    }
  }, [getEarnings]);

  if (!earnings) {
    return <div className="p-4">Loading earnings...</div>;
  }

  return (
    <div className="flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100">
      <img className="w-14" src={'/assets/earning_icon.svg'} alt="Earnings Icon" />
      <div>
        <p className="text-xl font-semibold text-gray-600">
          ${earnings.total}
        </p>
        <p className="text-gray-400">Earnings</p>
      </div>
    </div>
  );
};

export default Earnings;
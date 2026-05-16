"use client";

import { useContext } from 'react';
import { useRouter } from 'next/navigation';

import { DoctorContext } from '@/context/DoctorContext';
import { AdminContext } from '@/context/AdminContext';
import type { IDoctorContext, IAdminContext } from '@/models/doctor';

const Navbar = () => {
  const { dToken, setDToken } = useContext(DoctorContext) as IDoctorContext;
  const { aToken, setAToken } = useContext(AdminContext) as IAdminContext;

  const router = useRouter();

  const logout = () => {
    router.push('/');
    if (dToken) {
      setDToken('');
      localStorage.removeItem('dToken');
    }
    if (aToken) {
      setAToken('');
      localStorage.removeItem('aToken');
    }
  };

  return (
    <div className="flex justify-between items-center px-4 sm:px-10 py-3 border-b bg-white">
      <div className="flex items-center gap-2 text-xs">
        <img 
          src="/MedicsOnline_logo.png" 
          alt="MedicsOnline Logo" 
          className="h-10 cursor-pointer"
          onClick={() => router.push('/')}
        />
        <p className="border-2 px-2.5 py-0.5 rounded-full border-primary">
          {aToken ? 'Admin' : 'Doctor'}
        </p>
      </div>
      <button
        onClick={() => logout()}
        className="bg-primary text-white text-sm px-10 py-2 rounded-full cursor-pointer"
      >
        Logout
      </button>
    </div>
  );
};

export default Navbar;

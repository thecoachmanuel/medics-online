"use client";

import { useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { DoctorContext } from '@/context/DoctorContext';
import { AdminContext } from '@/context/AdminContext';

import PatientNavbar from '@/components/layout/Patient/general/Navbar';
import Footer from '@/components/layout/Patient/general/Footer';
import AdminNavbar from '@/components/layout/Admin/Navbar';
import Sidebar from '@/components/layout/Admin/Sidebar';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { dToken } = useContext(DoctorContext);
  const { aToken } = useContext(AdminContext);
  const pathname = usePathname() || '/';

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const isMeetingPage = pathname.startsWith('/meeting/') || pathname === '/join' || pathname === '/new';
  const isAdminLoginPage = pathname === '/admin-login';
  const hideNavbarAndFooter = isMeetingPage || isAdminLoginPage;

  if (!isMounted) {
    return (
      <div className="mx-4 sm:mx-[6%]">
        <ToastContainer />
        <div className="h-20" /> {/* Skeleton for navbar */}
        {children}
      </div>
    );
  }

  if (aToken || dToken) {
    return (
      <div className={isMeetingPage ? '' : ''}>
        <ToastContainer />
        {!isMeetingPage && <AdminNavbar />}
        <div className={isMeetingPage ? '' : 'flex items-start'}>
          {!isMeetingPage && <Sidebar />}
          <div className="w-full">
            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={hideNavbarAndFooter ? '' : 'mx-4'}>
      {!hideNavbarAndFooter && <PatientNavbar />}
      <div className={hideNavbarAndFooter ? '' : 'sm:mx-[6%]'}>
        <ToastContainer />
        {children}
      </div>
      {!hideNavbarAndFooter && <Footer />}
    </div>
  );
}

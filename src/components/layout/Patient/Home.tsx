"use client";

import { useContext } from 'react';
import { useRouter } from 'next/navigation';

import Header from '@/components/layout/Patient/general/Header';
import SpecialityMenu from '@/components/layout/Patient/general/SpecialityMenu';
import TopDoctors from '@/components/layout/Patient/general/TopDoctors';
import Banner from '@/components/layout/Patient/general/Banner';
import { AppContext } from '@/context/AppContext';
import type { IPatientAppContext } from '@/models/patient';

const Home = () => {
  const router = useRouter();
  const { token } = useContext(AppContext) as IPatientAppContext;

  return (
    <div>
      <Header />
      <SpecialityMenu />
      <TopDoctors />
      <Banner />

      {/* Security Information Section */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            🔐 Your Data is Protected
          </h2>
          <p className="text-gray-600 mb-4">
            All your medical data and communications are secured with military-grade encryption.
          </p>
          <button
            onClick={() => router.push('/encryption-explained')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Learn How Your Data is Protected
          </button>
        </div>
      </div>

      {/* Floating Action Button for My Appointments */}
      {token && (
        <button
          onClick={() => router.push('/my-appointments')}
          className="fixed bottom-6 right-6 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary/90 transition-all duration-300 z-50 flex items-center gap-2 cursor-pointer"
          title="My Appointments"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="hidden sm:inline">My Appointments</span>
        </button>
      )}
    </div>
  );
};

export default Home;

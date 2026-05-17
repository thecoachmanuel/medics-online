"use client";

import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppContext } from '@/context/AppContext';
import type { IPatientAppContext, IDoctorPatient } from '@/models/patient';
import DoctorCard from '@/components/common/DoctorCard';

interface RelatedDoctorsProps {
  speciality: string;
  docId: string | undefined;
}

const RelatedDoctors = ({ speciality, docId }: RelatedDoctorsProps) => {
  const router = useRouter();
  const { doctors } = useContext(AppContext) as IPatientAppContext;

  const [relDoc, setRelDoc] = useState<IDoctorPatient[]>([]);

  useEffect(() => {
    if (doctors.length > 0 && speciality) {
      const doctorsData = doctors.filter(
        (doc: IDoctorPatient) => doc.speciality === speciality && doc._id !== docId
      );
      setRelDoc(doctorsData);
    }
  }, [doctors, speciality, docId]);

  return (
    <div className="flex flex-col items-center gap-4 my-16 text-[#262626]">
      <h1 className="text-3xl font-medium">Related Doctors</h1>
      <p className="sm:w-1/3 text-center text-sm">
        Simply browse through our extensive list of trusted doctors.
      </p>
      <div className="w-full grid-responsive pt-5">
        {relDoc.length > 0 ? (
          relDoc.map((item: IDoctorPatient, index: number) => (
            <DoctorCard key={index} doctor={item} />
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg 
                className="w-12 h-12 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" 
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No related doctors found
            </h3>
            <p className="text-gray-500 mb-6 max-w-md">
              {speciality 
                ? `No other ${speciality.toLowerCase()}s are currently available.` 
                : "No related doctors are available at the moment."
              }
            </p>
            <button
              onClick={() => {
                router.push('/doctors');
                scrollTo(0, 0);
              }}
              className="bg-primary text-white px-6 py-2 rounded-full hover:bg-primary/90 transition-all cursor-pointer"
            >
              Browse All Doctors
            </button>
          </div>
        )}
      </div>
      {/* <button className='bg-[#EAEFFF] text-gray-600 px-12 py-3 rounded-full mt-10'>more</button> */}
    </div>
  );
};

export default RelatedDoctors;

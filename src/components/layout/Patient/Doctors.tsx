"use client";

import { useContext, useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';

import { AppContext } from '@/context/AppContext';
import DoctorCard from '@/components/common/DoctorCard';
import EmptyState from '@/components/common/EmptyState';
import type { IPatientAppContext, IDoctorPatient } from '@/models/patient';

const Doctors = () => {
  const params = useParams() as { speciality: string };
  const speciality = Array.isArray(params.speciality) ? params.speciality[0] : params.speciality;

  const [showFilter, setShowFilter] = useState(false);
  const router = useRouter();

  const { doctors } = useContext(AppContext) as IPatientAppContext;

  const filterDoc = useMemo(() => {
    if (speciality) {
      const decodedSpeciality = decodeURIComponent(speciality).toLowerCase();
      return doctors.filter((doc: IDoctorPatient) => 
        doc.speciality.toLowerCase() === decodedSpeciality
      );
    }
    return doctors as IDoctorPatient[];
  }, [doctors, speciality]);

  // Helper to check if a speciality is selected (case-insensitive)
  const isSelected = (name: string) => {
    if (!speciality) return false;
    return decodeURIComponent(speciality).toLowerCase() === name.toLowerCase();
  };

  return (
    <div>
      <p className="text-gray-600">Browse through the doctors specialist.</p>
      <div className="flex flex-col sm:flex-row items-start gap-5 mt-5">
        <button
          onClick={() => setShowFilter(!showFilter)}
          className={`py-1 px-3 border rounded text-sm transition-all sm:hidden cursor-pointer ${showFilter ? 'bg-primary text-white' : ''}`}
        >
          Filters
        </button>
        <div
          className={`flex-wrap gap-2 text-sm text-gray-600 ${showFilter ? 'flex' : 'hidden sm:flex'} sm:flex-col sm:min-w-64`}
        >
          {[
            'General physician',
            'Gynecologist',
            'Dermatologist',
            'Pediatricians',
            'Neurologist',
            'Gastroenterologist'
          ].map((cat) => (
            <button
              key={cat}
              onClick={() =>
                isSelected(cat)
                  ? router.push('/doctors')
                  : router.push(`/doctors/${cat}`)
              }
              className={`flex items-center justify-between px-4 py-2.5 border rounded-lg transition-all duration-300 cursor-pointer text-left ${
                isSelected(cat)
                  ? 'bg-primary text-white border-primary shadow-md'
                  : 'bg-white hover:bg-gray-50 border-gray-200'
              }`}
            >
              <span>{cat}</span>
              {isSelected(cat) && (
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
        <div className="w-full grid-responsive">
          {filterDoc.length > 0 ? (
            filterDoc.map((item: IDoctorPatient, index: number) => (
              <DoctorCard key={index} doctor={item} />
            ))
          ) : (
            <EmptyState
              title="No doctors found"
              description={
                speciality 
                  ? `Sorry, we couldn't find any ${speciality.toString().toLowerCase()}s available at the moment.` 
                  : "No doctors are currently available. Please try again later."
              }
              actionLabel="Browse All Doctors"
              onAction={() => router.push('/doctors')}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Doctors;

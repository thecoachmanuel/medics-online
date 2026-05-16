"use client";

import { useContext, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

import { AppContext } from '@/context/AppContext';
import DoctorCard from '@/components/common/DoctorCard';
import EmptyState from '@/components/common/EmptyState';
import type { IPatientAppContext, IDoctorPatient } from '@/models/patient';

const Doctors = () => {
  const params = useParams() as { speciality: string };
  const speciality = Array.isArray(params.speciality) ? params.speciality[0] : params.speciality;

  const [filterDoc, setFilterDoc] = useState<IDoctorPatient[]>([]);
  const [showFilter, setShowFilter] = useState(false);
  const router = useRouter();

  const { doctors } = useContext(AppContext) as IPatientAppContext;

  const applyFilter = () => {
    if (speciality) {
      setFilterDoc(doctors.filter((doc: IDoctorPatient) => doc.speciality === speciality));
    } else {
      setFilterDoc(doctors as IDoctorPatient[]);
    }
  };

  useEffect(() => {
    applyFilter();
  }, [doctors, speciality]);

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
          className={`flex-col gap-4 text-sm text-gray-600 ${showFilter ? 'flex' : 'hidden sm:flex'}`}
        >
          <p
            onClick={() =>
              speciality === 'General physician'
                ? router.push('/doctors')
                : router.push('/doctors/General physician')
            }
            className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${speciality === 'General physician' ? 'bg-[#E2E5FF] text-black ' : ''}`}
          >
            General physician
          </p>
          <p
            onClick={() =>
              speciality === 'Gynecologist'
                ? router.push('/doctors')
                : router.push('/doctors/Gynecologist')
            }
            className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${speciality === 'Gynecologist' ? 'bg-[#E2E5FF] text-black ' : ''}`}
          >
            Gynecologist
          </p>
          <p
            onClick={() =>
              speciality === 'Dermatologist'
                ? router.push('/doctors')
                : router.push('/doctors/Dermatologist')
            }
            className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${speciality === 'Dermatologist' ? 'bg-[#E2E5FF] text-black ' : ''}`}
          >
            Dermatologist
          </p>
          <p
            onClick={() =>
              speciality === 'Pediatricians'
                ? router.push('/doctors')
                : router.push('/doctors/Pediatricians')
            }
            className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${speciality === 'Pediatricians' ? 'bg-[#E2E5FF] text-black ' : ''}`}
          >
            Pediatricians
          </p>
          <p
            onClick={() =>
              speciality === 'Neurologist' ? router.push('/doctors') : router.push('/doctors/Neurologist')
            }
            className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${speciality === 'Neurologist' ? 'bg-[#E2E5FF] text-black ' : ''}`}
          >
            Neurologist
          </p>
          <p
            onClick={() =>
              speciality === 'Gastroenterologist'
                ? router.push('/doctors')
                : router.push('/doctors/Gastroenterologist')
            }
            className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${speciality === 'Gastroenterologist' ? 'bg-[#E2E5FF] text-black ' : ''}`}
          >
            Gastroenterologist
          </p>
        </div>
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6">
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

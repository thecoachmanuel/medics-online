"use client";

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { IDoctorPatient } from '@/models/patient';

interface DoctorCardProps {
  doctor: IDoctorPatient;
  showAvailability?: boolean;
  className?: string;
}

const DoctorCard = ({ doctor, showAvailability = true, className = '' }: DoctorCardProps) => {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);

  const handleClick = () => {
    router.push(`/appointment/${doctor._id}`);
    scrollTo(0, 0);
  };

  return (
    <div
      onClick={handleClick}
      className={`border border-[#C9D8FF] rounded-xl overflow-hidden cursor-pointer hover:translate-y-[-10px] transition-all duration-500 ${className}`}
    >
      <div className="relative w-full aspect-doctor-card bg-gray-100">
        <Image 
          className="doctor-card-image" 
          src={imageError || !doctor.image ? '/assets/profile_pic.png' : doctor.image} 
          alt={doctor.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onError={() => setImageError(true)}
        />
      </div>
      <div className="p-4">
        {showAvailability && (
          <div
            className={`flex items-center gap-2 text-sm mb-2 ${
              doctor.available ? 'text-green-500' : 'text-gray-500'
            }`}
          >
            <p
              className={`w-2 h-2 rounded-full ${
                doctor.available ? 'bg-green-500' : 'bg-gray-500'
              }`}
            ></p>
            <p>{doctor.available ? 'Available' : 'Not Available'}</p>
          </div>
        )}
        <div className="flex items-center gap-1.5 mb-1">
          <p className="text-[#262626] text-lg font-medium truncate">{doctor.name}</p>
          {doctor.isVerified && (
            <img className="w-4 h-4 shrink-0" src="/assets/verified_icon.svg" alt="Verified Badge" />
          )}
        </div>
        <p className="text-[#5C5C5C] text-sm">{doctor.speciality}</p>
        {doctor.experience && (
          <p className="text-[#5C5C5C] text-xs mt-1">{doctor.experience} experience</p>
        )}
        {doctor.fees && (
          <p className="text-primary text-sm font-medium mt-2">₦{doctor.fees}</p>
        )}
      </div>
    </div>
  );
};

export default DoctorCard; 
"use client";

import { useState } from 'react';
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
      <div className="relative w-full h-48 bg-gray-100">
        <img 
          className="doctor-card-image w-full h-full object-cover" 
          src={imageError || !doctor.image ? '/assets/profile_pic.png' : doctor.image} 
          alt={doctor.name}
          loading="lazy"
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
        <p className="text-[#262626] text-lg font-medium mb-1">{doctor.name}</p>
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
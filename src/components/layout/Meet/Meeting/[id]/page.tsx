"use client";

import { useContext } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

import { AppContext } from '@/context/AppContext';
import { DoctorContext } from '@/context/DoctorContext';
import type { IPatientAppContext } from '@/models/patient';
import type { IDoctorContext } from '@/models/doctor';

const AgoraContainer = dynamic(() => import('./AgoraContainer'), { ssr: false });

export default function MeetingPage() {
  const params = useParams() as { id: string };
  const searchParams = useSearchParams();
  const meetingId = params.id as string;

  // Get user context for patient, doctor, or admin
  const patientContext = useContext(AppContext) as IPatientAppContext | null;
  const doctorContext = useContext(DoctorContext) as IDoctorContext | null;

  // Determine user name based on context
  const getUserName = () => {
    if (patientContext?.userData?.name) {
      return patientContext.userData.name;
    }
    if (doctorContext?.profileData?.name) {
      return doctorContext.profileData.name;
    }
    return searchParams?.get('name') || 'Guest';
  };

  const userName = getUserName();
  const isDoctor = !!doctorContext?.profileData;
  const token = isDoctor ? doctorContext?.dToken : patientContext?.token;

  return (
    <AgoraContainer 
      meetingId={meetingId} 
      userName={userName} 
      isDoctor={isDoctor}
      token={token}
    />
  );
}

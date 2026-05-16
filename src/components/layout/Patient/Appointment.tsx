"use client";

import { useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useRouter, useParams, useSearchParams } from 'next/navigation';

import { AppContext } from '@/context/AppContext';
import RelatedDoctors from '@/components/layout/Patient/general/RelatedDoctors';
import type { IPatientAppContext, IDoctorPatient, ApiResponse } from '@/models/patient';
import { smartApi } from '@/utils/smartApi';

const Appointment = () => {
  const { docId } = useParams();
  const { doctors, currencySymbol, token, getDoctosData } = useContext(
    AppContext
  ) as IPatientAppContext;
  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const [docInfo, setDocInfo] = useState<IDoctorPatient | undefined>(undefined);
  type Slot = { datetime: Date; time: string };
  const [docSlots, setDocSlots] = useState<Slot[][]>([]);
  const [slotIndex, setSlotIndex] = useState(0);
  const [slotTime, setSlotTime] = useState('');
  const [vitals, setVitals] = useState<{ bpm: string | number; spo2: string | number }>({
    bpm: '---',
    spo2: '---'
  });

  const searchParams = useSearchParams();
  const rescheduleId = searchParams.get('rescheduleId');
  const router = useRouter();

  const fetchDocInfo = () => {
    const docInfo = doctors.find((doc: IDoctorPatient) => doc._id === docId);
    setDocInfo(docInfo);
  };

  const fetchVitals = async () => {
    try {
      console.log('💓 Medical: Fetching encrypted vitals data');
      const data = await smartApi.get('/api/vitals/latest') as { 
        success: boolean; 
        bpm: string; 
        spo2: string; 
      };
      
      if (data.success) {
        setVitals({
          bpm: data.bpm,
          spo2: data.spo2
        });
        console.log('✅ Vitals data fetched via Smart API');
      }
    } catch (error: unknown) {
      console.log('Error fetching vitals:', error);
    }
  };

  const getAvailableSolts = () => {
    setDocSlots([]);
    if (!docInfo) return;
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);
      const endTime = new Date();
      endTime.setDate(today.getDate() + i);
      endTime.setHours(21, 0, 0, 0);
      if (today.getDate() === currentDate.getDate()) {
        currentDate.setHours(currentDate.getHours() > 10 ? currentDate.getHours() + 1 : 10);
        currentDate.setMinutes(currentDate.getMinutes() > 30 ? 30 : 0);
      } else {
        currentDate.setHours(10);
        currentDate.setMinutes(0);
      }
      const timeSlots: Slot[] = [];
      while (currentDate < endTime) {
        const formattedTime = currentDate.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        });
        const day = currentDate.getDate();
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();
        const slotDate = day + '_' + month + '_' + year;
        const slotTime = formattedTime;
        const isSlotAvailable =
          docInfo.slots_booked &&
          docInfo.slots_booked[slotDate] &&
          docInfo.slots_booked[slotDate].includes(slotTime)
            ? false
            : true;
        if (isSlotAvailable) {
          timeSlots.push({
            datetime: new Date(currentDate),
            time: formattedTime
          });
        }
        currentDate.setMinutes(currentDate.getMinutes() + 30);
      }
      setDocSlots((prev) => [...prev, timeSlots]);
    }
  };

  const bookAppointment = async () => {
    if (!token) {
      toast.warning('Login to book appointment');
      return router.push('/login');
    }
    const date = docSlots[slotIndex][0].datetime;
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const slotDate = day + '_' + month + '_' + year;
    try {
      console.log('🏥 Medical: Attempting encrypted appointment booking');
      const data = await smartApi.post('/api/user/book-appointment', 
        { docId, slotDate, slotTime, vitals },
        { headers: { token } }
      ) as ApiResponse<{ meetingId?: string }>;

      if (data.success) {
        toast.success(`${data.message}. Meeting ID: ${data.meetingId}`);
        getDoctosData();
        router.push('/my-appointments');
        console.log('✅ Appointment booked successfully via Smart API');
      } else {
        toast.error(data.message || 'Booking failed');
      }
    } catch (error: unknown) {
      console.error('❌ Appointment booking error:', error);
      if (
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof (error as { message?: unknown }).message === 'string'
      ) {
        toast.error((error as { message: string }).message);
      } else {
        toast.error('An error occurred while booking appointment');
      }
    }
  };

  const rescheduleAppointment = async () => {
    if (!token) {
      toast.warning('Login to reschedule appointment');
      return router.push('/login');
    }
    const date = docSlots[slotIndex][0].datetime;
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const slotDate = day + '_' + month + '_' + year;
    try {
      console.log('🏥 Medical: Attempting encrypted appointment rescheduling');
      const data = await smartApi.post('/api/user/reschedule-appointment', 
        { appointmentId: rescheduleId, slotDate, slotTime },
        { headers: { token } }
      ) as ApiResponse<{ meetingId?: string }>;

      if (data.success) {
        toast.success(`${data.message}. Meeting ID: ${data.meetingId}`);
        getDoctosData();
        router.push('/my-appointments');
        console.log('✅ Appointment rescheduled successfully via Smart API');
      } else {
        toast.error(data.message || 'Rescheduling failed');
      }
    } catch (error: unknown) {
      console.error('❌ Appointment rescheduling error:', error);
      if (
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof (error as { message?: unknown }).message === 'string'
      ) {
        toast.error((error as { message: string }).message);
      } else {
        toast.error('An error occurred while rescheduling appointment');
      }
    }
  };

  useEffect(() => {
    if (doctors.length > 0) {
      fetchDocInfo();
    }
  }, [doctors, docId]);

  useEffect(() => {
    if (docInfo) {
      getAvailableSolts();
    }
  }, [docInfo]);

  useEffect(() => {
    // Initial fetch
    fetchVitals();

    // Set up interval for continuous updates (every 1.5 seconds)
    const intervalId = setInterval(fetchVitals, 1500);

    // Clean up on component unmount
    return () => clearInterval(intervalId);
  }, []);

  return docInfo ? (
    <div>
      {/* ---------- Doctor and Patient Details ----------- */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div>
          <img className="doctor-profile-image w-full sm:max-w-72 rounded-lg" src={docInfo.image} alt={`Dr. ${docInfo.name}`} />
        </div>
        <div className="flex flex-col flex-1 gap-3">
          <div className="border border-[#ADADAD] rounded-lg p-8 py-7 bg-white mx-2 sm:mx-0 mt-[-80px] sm:mt-0">
            {/* ----- Doc Info : name, degree, experience ----- */}

            <p className="flex items-center gap-2 text-3xl font-medium text-gray-700">
              {docInfo.name} <img className="w-5" src={'/assets/verified_icon.svg'} alt="" />
            </p>
            <div className="flex items-center gap-2 mt-1 text-gray-600">
              <p>
                {docInfo.degree} - {docInfo.speciality}
              </p>
              <button className="py-0.5 px-2 border text-xs rounded-full">
                {docInfo.experience}
              </button>
            </div>

            {/* ----- Doc About ----- */}
            <div>
              <p className="flex items-center gap-1 text-sm font-medium text-[#262626] mt-3">
                About <img className="w-3" src={'/assets/info_icon.svg'} alt="" />
              </p>
              <p className="text-sm text-gray-600 max-w-[700px] mt-1">{docInfo.about}</p>
            </div>

            <p className="text-gray-600 font-medium mt-4">
              Appointment fee:{' '}
              <span className="text-gray-800">
                {currencySymbol}
                {docInfo.fees}
              </span>{' '}
            </p>
          </div>

          <div className="border border-[#ADADAD] rounded-lg p-8 py-7 bg-white mx-2 sm:mx-0 mt-[-80px] sm:mt-0">
            {/* ----- Patient Vitals ----- */}
            <div>
              <p className="flex items-center gap-1 text-sm font-medium text-[#262626]">
                Patient Vitals{' '}
                <span className="ml-2 animate-pulse text-xs bg-green-100 text-green-800 py-0.5 px-2 rounded-full">
                  Live
                </span>
              </p>
              <div className="flex gap-6 mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 flex items-center justify-center bg-red-100 rounded-full">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5 text-red-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"></path>
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Heart Rate</p>
                    <p className="text-lg font-medium">
                      {vitals.bpm} <span className="text-xs">BPM</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 flex items-center justify-center bg-blue-100 rounded-full">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5 text-blue-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Oxygen Saturation</p>
                    <p className="text-lg font-medium">
                      {vitals.spo2} <span className="text-xs">%</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking slots */}
      <div className="sm:ml-72 sm:pl-4 mt-8 font-medium text-[#565656]">
        <p>Booking slots</p>
        <div className="flex gap-3 items-center w-full overflow-x-scroll mt-4">
          {docSlots.length > 0 &&
            docSlots.map((item: Slot[], index: number) => (
              <div
                onClick={() => setSlotIndex(index)}
                key={index}
                className={`text-center py-6 min-w-16 rounded-full cursor-pointer ${slotIndex === index ? 'bg-primary text-white' : 'border border-[#DDDDDD]'}`}
              >
                <p>{item[0] && daysOfWeek[item[0].datetime.getDay()]}</p>
                <p>{item[0] && item[0].datetime.getDate()}</p>
              </div>
            ))}
        </div>

        <div className="flex items-center gap-3 w-full overflow-x-scroll mt-4">
          {docSlots.length > 0 &&
            docSlots[slotIndex].map((item: Slot, index: number) => (
              <p
                onClick={() => setSlotTime(item.time)}
                key={index}
                className={`text-sm font-light  flex-shrink-0 px-5 py-2 rounded-full cursor-pointer ${item.time === slotTime ? 'bg-primary text-white' : 'text-[#949494] border border-[#B4B4B4]'}`}
              >
                {item.time.toLowerCase()}
              </p>
            ))}
        </div>

        <button
          onClick={rescheduleId ? rescheduleAppointment : bookAppointment}
          className="bg-primary text-white text-sm font-light px-20 py-3 rounded-full my-6 cursor-pointer"
        >
          {rescheduleId ? 'Reschedule appointment' : 'Book an appointment'}
        </button>
      </div>

      {/* Listing Releated Doctors */}
      <RelatedDoctors speciality={docInfo.speciality} docId={docId} />
    </div>
  ) : null;
};

export default Appointment;

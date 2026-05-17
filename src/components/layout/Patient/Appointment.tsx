"use client";

import { useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';

import { AppContext } from '@/context/AppContext';
import RelatedDoctors from '@/components/layout/Patient/general/RelatedDoctors';
import type { IPatientAppContext, IDoctorPatient, ApiResponse } from '@/models/patient';
import { smartApi } from '@/utils/smartApi';

const Appointment = () => {
  const params = useParams() as { docId: string };
  const docId = Array.isArray(params.docId) ? params.docId[0] : params.docId;
  const { doctors, currencySymbol, token, getDoctosData, userData } = useContext(
    AppContext
  ) as IPatientAppContext;
  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const [docInfo, setDocInfo] = useState<IDoctorPatient | undefined>(undefined);
  type Slot = { datetime: Date; time: string };
  const [docSlots, setDocSlots] = useState<Slot[][]>([]);
  const [slotIndex, setSlotIndex] = useState(0);
  const [slotTime, setSlotTime] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [vitals, setVitals] = useState<{ bpm: string | number; spo2: string | number }>({
    bpm: '---',
    spo2: '---'
  });

  const searchParams = useSearchParams();
  const rescheduleId = searchParams?.get('rescheduleId');
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

    const startStr = docInfo.workingHoursStart || '10:00';
    const endStr = docInfo.workingHoursEnd || '22:00';
    const excluded = docInfo.excludedDays || [];

    const startHours = parseInt(startStr.split(':')[0], 10) || 10;
    const startMinutes = parseInt(startStr.split(':')[1], 10) || 0;
    const endHours = parseInt(endStr.split(':')[0], 10) || 22;
    const endMinutes = parseInt(endStr.split(':')[1], 10) || 0;

    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);

      const timeSlots: Slot[] = [];

      // Check if day is excluded
      const dayOfWeek = currentDate.getDay();
      if (!excluded.includes(dayOfWeek)) {
        // Retrieve multiple working hour ranges, or fallback to the single range
        const ranges = docInfo.workingHours && docInfo.workingHours.length > 0
          ? docInfo.workingHours
          : [{ start: startStr, end: endStr }];

        for (const range of ranges) {
          const rStartStr = range.start || '10:00';
          const rEndStr = range.end || '22:00';

          const rStartHours = parseInt(rStartStr.split(':')[0], 10) || 10;
          const rStartMinutes = parseInt(rStartStr.split(':')[1], 10) || 0;
          const rEndHours = parseInt(rEndStr.split(':')[0], 10) || 22;
          const rEndMinutes = parseInt(rEndStr.split(':')[1], 10) || 0;

          const slotStart = new Date(today);
          slotStart.setDate(today.getDate() + i);
          
          const slotEnd = new Date(today);
          slotEnd.setDate(today.getDate() + i);
          slotEnd.setHours(rEndHours, rEndMinutes, 0, 0);

          if (today.getDate() === currentDate.getDate()) {
            // If today, make sure we only suggest future slots
            let currentStartHours = rStartHours;
            let currentStartMinutes = rStartMinutes;
            
            const nowHour = today.getHours();
            const nowMinute = today.getMinutes();
            
            if (nowHour > rStartHours || (nowHour === rStartHours && nowMinute >= rStartMinutes)) {
              currentStartHours = nowHour;
              if (nowMinute < 30) {
                currentStartMinutes = 30;
              } else {
                currentStartHours += 1;
                currentStartMinutes = 0;
              }
            }
            slotStart.setHours(currentStartHours, currentStartMinutes, 0, 0);
          } else {
            slotStart.setHours(rStartHours, rStartMinutes, 0, 0);
          }

          const runningDate = new Date(slotStart);
          while (runningDate < slotEnd) {
            const formattedTime = runningDate.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            });
            const day = runningDate.getDate();
            const month = runningDate.getMonth() + 1;
            const year = runningDate.getFullYear();
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
                datetime: new Date(runningDate),
                time: formattedTime
              });
            }
            runningDate.setMinutes(runningDate.getMinutes() + 30);
          }
        }
        
        // Sort slots chronologically in case of multiple/overlapping ranges
        timeSlots.sort((a, b) => a.datetime.getTime() - b.datetime.getTime());
      }
      setDocSlots((prev) => [...prev, timeSlots]);
    }
  };
  const bookAppointment = async () => {
    if (!token || !userData) {
      toast.warning('Login to book appointment');
      return router.push('/login');
    }

    if (!docSlots[slotIndex] || docSlots[slotIndex].length === 0) {
      return toast.warning('No available slots on this day');
    }

    if (!slotTime) {
      return toast.warning('Please select a time slot');
    }

    setIsBooking(true);
    const date = docSlots[slotIndex][0].datetime;
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const slotDate = day + '_' + month + '_' + year;
    try {
      console.log('🏥 Medical: Initiating appointment payment');
      const data = await smartApi.post('/api/user/payment-paystack', 
        { docId, slotDate, slotTime, vitals, userId: userData._id },
        { headers: { token } }
      ) as ApiResponse<{ authorization_url?: string }>;

      if (data.success && data.authorization_url) {
        // Redirect to Paystack payment page
        window.location.href = data.authorization_url;
      } else {
        toast.error(data.message || 'Payment initialization failed');
        setIsBooking(false);
      }
    } catch (error: unknown) {
      console.error('❌ Appointment payment error:', error);
      toast.error('An error occurred while initiating payment');
      setIsBooking(false);
    }
  };

  const rescheduleAppointment = async () => {
    if (!token) {
      toast.warning('Login to reschedule appointment');
      return router.push('/login');
    }
    if (!docSlots[slotIndex] || docSlots[slotIndex].length === 0) {
      return toast.warning('No available slots on this day');
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
        <div className="relative w-full sm:max-w-72 aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
          <Image 
            className="doctor-profile-image object-cover" 
            src={docInfo.image} 
            alt={`Dr. ${docInfo.name}`} 
            fill
            sizes="(max-width: 640px) 100vw, 288px"
            priority
          />
        </div>
        <div className="flex flex-col flex-1 gap-3">
          <div className="border border-[#ADADAD] rounded-lg p-8 py-7 bg-white mx-2 sm:mx-0 mt-[-80px] sm:mt-0">
            {/* ----- Doc Info : name, degree, experience ----- */}

            <p className="flex items-center gap-2 text-3xl font-medium text-gray-700">
              {docInfo.name} {docInfo.isVerified && <img className="w-5" src={'/assets/verified_icon.svg'} alt="" />}
            </p>
            <div className="flex items-center gap-2 mt-1 text-gray-600">
              <p>
                {docInfo.degree} - {docInfo.speciality}
              </p>
              <button className="py-0.5 px-2 border text-xs rounded-full">
                {docInfo.experience}
              </button>
            </div>

            {/* Doctor Average Star Rating */}
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => {
                  const rating = docInfo.averageRating || 0;
                  const isFilled = star <= Math.round(rating);
                  return (
                    <svg
                      key={star}
                      className={`h-5 w-5 ${isFilled ? 'text-amber-400 fill-current' : 'text-gray-200'}`}
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  );
                })}
              </div>
              <span className="text-sm font-semibold text-gray-700">
                {docInfo.averageRating ? `${docInfo.averageRating} / 5` : 'No reviews yet'}
              </span>
              {docInfo.ratingsCount ? (
                <span className="text-xs text-gray-400 font-medium">
                  ({docInfo.ratingsCount} {docInfo.ratingsCount === 1 ? 'review' : 'reviews'})
                </span>
              ) : null}
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
            docSlots.map((item: Slot[], index: number) => {
              const dateObj = new Date();
              dateObj.setDate(dateObj.getDate() + index);
              const dayName = daysOfWeek[dateObj.getDay()];
              const dateNum = dateObj.getDate();

              return (
                <div
                  onClick={() => setSlotIndex(index)}
                  key={index}
                  className={`text-center py-6 min-w-16 rounded-full cursor-pointer ${slotIndex === index ? 'bg-primary text-white' : 'border border-[#DDDDDD]'}`}
                >
                  <p>{dayName}</p>
                  <p>{dateNum}</p>
                </div>
              );
            })}
        </div>

        <div className="flex items-center gap-3 w-full overflow-x-scroll mt-4">
          {docSlots.length > 0 && docSlots[slotIndex] && docSlots[slotIndex].length > 0 ? (
            docSlots[slotIndex].map((item: Slot, index: number) => (
              <p
                onClick={() => setSlotTime(item.time)}
                key={index}
                className={`text-sm font-light flex-shrink-0 px-5 py-2 rounded-full cursor-pointer ${item.time === slotTime ? 'bg-primary text-white' : 'text-[#949494] border border-[#B4B4B4]'}`}
              >
                {item.time.toLowerCase()}
              </p>
            ))
          ) : (
            <p className="text-sm font-semibold text-red-500 my-2">
              No working hours or slots available for this day.
            </p>
          )}
        </div>

        <button
          disabled={isBooking}
          onClick={rescheduleId ? rescheduleAppointment : bookAppointment}
          className={`bg-primary text-white text-sm font-light px-20 py-3 rounded-full my-6 cursor-pointer flex items-center gap-2 ${isBooking ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {isBooking ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Redirecting to Payment...
            </>
          ) : (
            rescheduleId ? 'Reschedule appointment' : 'Pay & Book Appointment'
          )}
        </button>
      </div>

      {/* Reviews & Comments Section */}
      <div className="mt-12 bg-white rounded-3xl border border-[#ADADAD]/30 p-8 sm:p-10 shadow-sm">
        <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span>Patient Reviews</span>
          {docInfo.ratingsCount ? (
            <span className="text-sm font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-100 text-amber-700">
              {docInfo.averageRating} ★ ({docInfo.ratingsCount})
            </span>
          ) : null}
        </h3>

        {!docInfo.reviews || docInfo.reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center text-amber-400 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <p className="text-gray-600 font-semibold">No patient reviews yet</p>
            <p className="text-gray-400 text-sm mt-1 max-w-xs">Reviews can only be written by verified patients after a completed appointment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_2fr] gap-10">
            {/* Left side: Aggregated rating cards */}
            <div className="space-y-6">
              <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50/30 border border-amber-100 rounded-2xl text-center space-y-2">
                <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Overall Rating</p>
                <div className="flex items-baseline justify-center gap-1.5">
                  <span className="text-5xl font-extrabold text-amber-900">{docInfo.averageRating}</span>
                  <span className="text-gray-400 font-medium">/ 5</span>
                </div>
                <div className="flex justify-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`h-5 w-5 ${star <= Math.round(docInfo.averageRating || 0) ? 'text-amber-400 fill-current' : 'text-gray-200'}`}
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-xs text-gray-500 font-medium mt-1">Based on {docInfo.ratingsCount} verified reviews</p>
              </div>

              {/* Progress bars chart */}
              <div className="space-y-3 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                {[5, 4, 3, 2, 1].map((ratingVal) => {
                  const count = docInfo.reviews?.filter((r) => r.rating === ratingVal).length || 0;
                  const total = docInfo.reviews?.length || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={ratingVal} className="flex items-center gap-3 text-sm">
                      <span className="w-3 font-semibold text-gray-600 flex justify-end">{ratingVal}</span>
                      <span className="text-amber-400">★</span>
                      <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-10 text-gray-400 text-xs font-semibold flex justify-end">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right side: Reviews list */}
            <div className="space-y-5 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {docInfo.reviews.map((review, rIdx) => {
                const dateStr = new Date(review.date).toLocaleDateString([], {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                });
                return (
                  <div key={rIdx} className="p-6 bg-white border border-gray-150 rounded-2xl space-y-3 shadow-sm hover:shadow transition-shadow duration-200">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-full bg-gradient-to-tr from-primary/10 to-primary/20 flex items-center justify-center text-primary font-bold text-sm shadow-sm overflow-hidden flex-shrink-0">
                          {review.userImage ? (
                            <img className="w-full h-full object-cover" src={review.userImage} alt={review.userName} />
                          ) : (
                            review.userName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 text-sm">{review.userName}</p>
                          <p className="text-gray-400 text-xs font-semibold">{dateStr}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100/50">
                        <span className="text-amber-800 font-extrabold text-xs">{review.rating}</span>
                        <span className="text-amber-400 text-sm">★</span>
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm leading-relaxed italic">
                      "{review.comment || 'No written feedback provided, just a star rating.'}"
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Listing Releated Doctors */}
      <RelatedDoctors speciality={docInfo.speciality} docId={docId || undefined} />
    </div>
  ) : null;
};

export default Appointment;

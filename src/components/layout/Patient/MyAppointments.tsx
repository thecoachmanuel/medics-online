"use client";

import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Image from 'next/image';

import { AppContext } from '@/context/AppContext';
import type { IPatientAppContext } from '@/models/patient';
import type { IAppointment } from '@/models/appointment';
import { smartApi } from '@/utils/smartApi';


const MyAppointments = () => {
  const { token, userData } = useContext(AppContext) as IPatientAppContext;

  const [appointments, setAppointments] = useState<IAppointment[]>([]);
  const [payment, setPayment] = useState<string>('');
  const [showRecords, setShowRecords] = useState<IAppointment | null>(null);
  const [ratingAppointment, setRatingAppointment] = useState<IAppointment | null>(null);
  const [ratingValue, setRatingValue] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [commentText, setCommentText] = useState<string>('');
  const [isSubmittingRating, setIsSubmittingRating] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'past' | 'cancelled'>('all');
  const router = useRouter();

  const isSlotPast = (slotDate: string, slotTime: string) => {
    try {
      const dateArray = slotDate.split('_');
      const day = parseInt(dateArray[0]);
      const month = parseInt(dateArray[1]) - 1;
      const year = parseInt(dateArray[2]);

      let hours = 0;
      let minutes = 0;
      
      const ampmMatch = slotTime.match(/(AM|PM)/i);
      const timeParts = slotTime.replace(/(AM|PM)/i, '').trim().split(':');
      
      if (timeParts.length >= 2) {
        hours = parseInt(timeParts[0]);
        minutes = parseInt(timeParts[1]);
        if (ampmMatch) {
          const period = ampmMatch[0].toUpperCase();
          if (period === 'PM' && hours < 12) hours += 12;
          if (period === 'AM' && hours === 12) hours = 0;
        }
      }
      const appointmentDate = new Date(year, month, day, hours, minutes);
      return appointmentDate.getTime() < Date.now();
    } catch {
      return false;
    }
  };

  const displayedAppointments = appointments.filter((item) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'cancelled') return item.cancelled;
    const isPast = item.isCompleted || isSlotPast(item.slotDate, item.slotTime);
    if (statusFilter === 'past') return isPast;
    return !item.cancelled && !item.isCompleted && !isPast;
  });

  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ];

  // Function to format the date eg. ( 20_01_2000 => 20 Jan 2000 )
  const slotDateFormat = (slotDate: string) => {
    const dateArray = slotDate.split('_');
    return dateArray[0] + ' ' + months[Number(dateArray[1]) - 1] + ' ' + dateArray[2];
  };

  // Function to check if appointment cannot be joined (too far in future or too far in past)
  const getAppointmentJoinStatus = (slotDate: string, slotTime: string) => {
    const dateArray = slotDate.split('_');
    const day = parseInt(dateArray[0]);
    const month = parseInt(dateArray[1]) - 1; // JavaScript months are 0-indexed
    const year = parseInt(dateArray[2]);

    // Parse time (robustly handling 12h and 24h formats)
    let hours = 0;
    let minutes = 0;
    
    const ampmMatch = slotTime.match(/(AM|PM)/i);
    const timeParts = slotTime.replace(/(AM|PM)/i, '').trim().split(':');
    
    if (timeParts.length >= 2) {
      hours = parseInt(timeParts[0]);
      minutes = parseInt(timeParts[1]);
      
      if (ampmMatch) {
        const period = ampmMatch[0].toUpperCase();
        if (period === 'PM' && hours < 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
      }
    } else {
      console.error('❌ Failed to parse slotTime:', slotTime);
      return { canJoin: false, reason: 'invalid_format' };
    }
    
    // Create appointment date
    const appointmentDate = new Date(year, month, day, hours, minutes);
    const now = new Date();

    // Calculate difference in milliseconds
    const diffMs = appointmentDate.getTime() - now.getTime();

    // Convert to hours
    const diffHours = diffMs / (60 * 60 * 1000);

    console.log('🕒 Time Check:', {
      appointmentDate: appointmentDate.toLocaleString(),
      now: now.toLocaleString(),
      diffHours,
      slotDate,
      slotTime
    });

    // Check if more than 24 hours in the future
    if (diffHours > 24) {
      return { canJoin: false, reason: 'future' };
    }

    // Check if more than 2 hours in the past
    if (diffHours < -2) {
      return { canJoin: false, reason: 'past' };
    }

    return { canJoin: true, reason: 'available' };
  };

  // Getting User Appointments Data Using API
  const getUserAppointments = async () => {
    try {
      console.log('🏥 Medical: Fetching encrypted appointments list');
      const data = await smartApi.get('/api/user/appointments', {
        headers: { token }
      }) as { appointments: IAppointment[] };

      setAppointments(data.appointments.reverse());
      console.log('✅ Appointments loaded successfully via Smart API');
    } catch (error: unknown) {
      console.error('❌ Appointments loading error:', error);
      if (
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof (error as { message?: unknown }).message === 'string'
      ) {
        toast.error((error as { message: string }).message);
      } else {
        toast.error('An error occurred while loading appointments');
      }
    }
  };

  // Function to submit doctor rating & comment Using API
  const submitDoctorRating = async () => {
    if (!ratingAppointment) return;
    setIsSubmittingRating(true);
    try {
      console.log('⭐️ Rating Doctor...');
      const data = await smartApi.post('/api/user/rate-doctor', {
        appointmentId: ratingAppointment._id,
        rating: ratingValue,
        comment: commentText
      }, {
        headers: { token }
      }) as { success: boolean; message?: string };

      if (data.success) {
        toast.success(data.message || 'Thank you for your rating!');
        setRatingAppointment(null);
        setCommentText('');
        setRatingValue(5);
        getUserAppointments(); // reload list
      } else {
        toast.error(data.message || 'Failed to submit rating');
      }
    } catch (error: unknown) {
      console.error('❌ Rating error:', error);
      if (
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof (error as { message?: unknown }).message === 'string'
      ) {
        toast.error((error as { message: string }).message);
      } else {
        toast.error('An error occurred while submitting rating');
      }
    } finally {
      setIsSubmittingRating(false);
    }
  };

  // Function to cancel appointment Using API
  const cancelAppointment = async (appointmentId: string) => {
    try {
      console.log('🏥 Medical: Attempting encrypted appointment cancellation');
      const data = await smartApi.post('/api/user/cancel-appointment',
        { appointmentId },
        { headers: { token } }
      ) as { success: boolean; message?: string };

      if (data.success) {
        toast.success(data.message || 'Appointment cancelled successfully');
        getUserAppointments();
        console.log('✅ Appointment cancelled successfully via Smart API');
      } else {
        toast.error(data.message || 'Cancellation failed');
      }
    } catch (error: unknown) {
      console.error('❌ Appointment cancellation error:', error);
      if (
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof (error as { message?: unknown }).message === 'string'
      ) {
        toast.error((error as { message: string }).message);
      } else {
        toast.error('An error occurred while cancelling appointment');
      }
    }
  };

  // Function to make payment using Paystack
  const appointmentPaystack = async (appointmentId: string) => {
    try {
      const data: any = await smartApi.post('/api/user/payment-paystack',
        { appointmentId },
        { headers: { token } }
      );
      if (data.success) {
        const { authorization_url } = data;
        window.location.replace(authorization_url);
      } else {
        toast.error(data.message);
      }
    } catch (error: unknown) {
      console.log(error);
      if (
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof (error as { message?: unknown }).message === 'string'
      ) {
        toast.error((error as { message: string }).message);
      } else {
        toast.error('An error occurred');
      }
    }
  };

  useEffect(() => {
    if (token) {
      getUserAppointments();
    }
  }, [token]);

  return (
    <div>
      <div className="pb-3 mt-12 border-b">
        <p className="text-xl font-bold text-gray-800">My Consultations</p>
        <p className="text-sm text-gray-500 mb-4">View and track your booking schedules</p>
        
        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
          {(['all', 'upcoming', 'past', 'cancelled'] as const).map((status) => {
            const count = appointments.filter((item) => {
              if (status === 'all') return true;
              if (status === 'cancelled') return item.cancelled;
              const isPast = item.isCompleted || isSlotPast(item.slotDate, item.slotTime);
              if (status === 'past') return isPast;
              return !item.cancelled && !item.isCompleted && !isPast;
            }).length;

            const label = status.charAt(0).toUpperCase() + status.slice(1);

            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  statusFilter === status
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 border border-transparent hover:border-gray-200'
                }`}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>
      </div>
      <div className="">
        {displayedAppointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-gray-50/50 border border-dashed border-gray-200 rounded-3xl mt-6 text-center">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-lg font-bold text-gray-800">No consultations found</p>
            <p className="text-sm text-gray-500 max-w-sm mt-1 mb-6">
              You do not have any scheduled appointments. Book a consultation with one of our trusted healthcare providers today.
            </p>
            <button
              onClick={() => {
                router.push('/doctors');
                scrollTo(0, 0);
              }}
              className="px-8 py-3 bg-primary text-white font-semibold rounded-full shadow-md hover:bg-primary/90 hover:shadow-lg active:scale-95 transition-all duration-200 cursor-pointer flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Book an Appointment
            </button>
          </div>
        ) : (
          displayedAppointments.map((item: IAppointment, index: number) => (
          <div
            key={index}
            className="grid grid-cols-[1fr_2fr] gap-4 sm:flex sm:gap-6 py-4 border-b"
          >
            <div className="relative w-36 h-48 bg-gray-100 rounded overflow-hidden flex-shrink-0">
              <Image 
                className="doctor-profile-image object-cover" 
                src={item.docData.image} 
                alt={`Dr. ${item.docData.name}`} 
                fill
                sizes="144px"
              />
            </div>
            <div className="flex-1 text-sm text-[#5E5E5E]">
              <p className="text-[#262626] text-base font-semibold">{item.docData.name}</p>
              <p>{item.docData.speciality}</p>
              <p className="text-[#464646] font-medium mt-1">Address:</p>
              <p className="">{item.docData.address.line1}</p>
              <p className="">{item.docData.address.line2}</p>
              <p className=" mt-1">
                <span className="text-sm text-[#3C3C3C] font-medium">Date & Time:</span>{' '}
                {slotDateFormat(item.slotDate)} | {item.slotTime}
              </p>
              {item.meetingId && (
                <p className="mt-1">
                  <span className="text-sm text-[#3C3C3C] font-medium">Meeting ID:</span>{' '}
                  <span className="text-sm text-blue-600 font-mono">{item.meetingId}</span>
                </p>
              )}
              {item.cancelled && item.cancellationReason && (
                <div className="mt-3 p-4 bg-red-50/80 border border-red-100 rounded-xl space-y-2 max-w-md">
                  <p className="text-xs font-semibold text-red-600 uppercase tracking-wider flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Cancelled by Doctor:
                  </p>
                  <p className="text-sm text-gray-800 italic font-medium">
                    "{item.cancellationReason}"
                  </p>
                  {item.suggestedRebookTime && (
                    <div className="pt-2 border-t border-red-100/50 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-gray-500">Suggested Rebook Time:</span>
                      <span className="text-xs font-bold text-primary bg-primary/5 px-2.5 py-0.5 rounded-full border border-primary/10">
                        {item.suggestedRebookTime}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div></div>
            <div className="flex flex-col gap-2 justify-end text-sm text-center">
              {item.meetingId && (() => {
                const joinStatus = getAppointmentJoinStatus(item.slotDate, item.slotTime);
                const getTooltipMessage = () => {
                  if (joinStatus.reason === 'future') {
                    // Calculate when meeting becomes available (24 hours before appointment)
                    const dateArray = item.slotDate.split('_');
                    const day = parseInt(dateArray[0]);
                    const month = parseInt(dateArray[1]) - 1;
                    const year = parseInt(dateArray[2]);

                    const timeMatch = item.slotTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
                    if (timeMatch) {
                      let hours = parseInt(timeMatch[1]);
                      const minutes = parseInt(timeMatch[2]);
                      const period = timeMatch[3].toUpperCase();

                      if (period === 'AM' && hours === 12) hours = 0;
                      else if (period === 'PM' && hours !== 12) hours += 12;

                      const appointmentDate = new Date(year, month, day, hours, minutes);
                      const availableDate = new Date(appointmentDate.getTime() - (24 * 60 * 60 * 1000));

                      // Format date as "11th June"
                      const dayWithSuffix = (day: number) => {
                        if (day > 3 && day < 21) return day + 'th';
                        switch (day % 10) {
                          case 1: return day + 'st';
                          case 2: return day + 'nd';
                          case 3: return day + 'rd';
                          default: return day + 'th';
                        }
                      };

                      const months = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];

                      const formattedDate = `${dayWithSuffix(availableDate.getDate())} ${months[availableDate.getMonth()]}`;
                      const formattedTime = availableDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                      return `Available from ${formattedDate} at ${formattedTime}`;
                    }
                    return 'Meeting will be available closer to your appointment time';
                  } else if (joinStatus.reason === 'past') {
                    return 'This meeting is over';
                  }
                  return 'Join the meeting';
                };

                const getButtonText = () => {
                  if (joinStatus.reason === 'past') {
                    return 'Meeting Over';
                  } else if (joinStatus.reason === 'future') {
                    return 'Scheduled';
                  }
                  return 'Join Meeting';
                };

                const getButtonStyles = () => {
                  if (joinStatus.reason === 'past') {
                    return 'border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed';
                  } else if (joinStatus.reason === 'future') {
                    return 'border-orange-300 text-orange-500 bg-orange-50 cursor-not-allowed';
                  }
                  return 'bg-primary text-white hover:bg-primary/90 shadow-md hover:shadow-lg scale-100 hover:scale-[1.02] cursor-pointer border-none';
                };

                return (
                  <button
                    onClick={() => {
                      console.log('🔘 Join button clicked. ID:', item.meetingId, 'canJoin:', joinStatus.canJoin, 'reason:', joinStatus.reason);
                      if (joinStatus.canJoin) {
                        router.push(`/meeting/${item.meetingId}?name=${encodeURIComponent(userData?.name || 'Patient')}`);
                      } else {
                        toast.info(`Meeting available later: ${joinStatus.reason}`);
                      }
                    }}
                    aria-label={getTooltipMessage()}
                    className={`sm:min-w-48 py-2.5 font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${getButtonStyles()}`}
                    title={getTooltipMessage()}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    {getButtonText()}
                  </button>
                );
              })()}

              {!item.cancelled && !item.payment && !item.isCompleted && payment !== item._id && (
                <button
                  onClick={() => setPayment(item._id)}
                  className="text-[#696969] sm:min-w-48 py-2 border rounded hover:bg-primary hover:text-white transition-all duration-300 cursor-pointer"
                >
                  Pay Online
                </button>
              )}
              {!item.cancelled && !item.payment && !item.isCompleted && payment === item._id && (
                <button
                  onClick={() => appointmentPaystack(item._id)}
                  className="text-[#696969] sm:min-w-48 py-2 border rounded hover:bg-gray-100 hover:text-white transition-all duration-300 flex items-center justify-center cursor-pointer"
                >
                  <span className="font-medium">Pay with Paystack</span>
                </button>
              )}
              {!item.cancelled && item.payment && !item.isCompleted && (
                <button className="sm:min-w-48 py-2 border rounded text-[#696969]  bg-[#EAEFFF]">
                  Paid
                </button>
              )}

              {item.isCompleted && (
                <div className="flex flex-col gap-2">
                  <button className="sm:min-w-48 py-2 border border-green-500 rounded text-green-500 bg-green-50">
                    Completed
                  </button>
                  <button
                    onClick={() => setShowRecords(item)}
                    className="sm:min-w-48 py-2 border border-blue-500 rounded text-blue-500 hover:bg-blue-500 hover:text-white transition-all duration-300"
                  >
                    View Records
                  </button>
                  {item.isRated ? (
                    <div className="flex items-center justify-center gap-1 sm:min-w-48 py-2 text-xs font-semibold text-amber-500 bg-amber-50 border border-amber-200 rounded-lg">
                      <span>Rated: {item.rating}/5</span>
                      <span className="text-amber-400">★</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => setRatingAppointment(item)}
                      className="sm:min-w-48 py-2 border border-amber-500 rounded text-amber-600 hover:bg-amber-600 hover:text-white transition-all duration-300 flex items-center justify-center gap-1.5 font-medium cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      Rate & Review
                    </button>
                  )}
                </div>
              )}

              {!item.cancelled && !item.isCompleted && (
                <button
                  onClick={() => cancelAppointment(item._id)}
                  className="text-[#696969] sm:min-w-48 py-2 border rounded hover:bg-red-600 hover:text-white transition-all duration-300 cursor-pointer"
                >
                  Cancel appointment
                </button>
              )}
              {item.cancelled && !item.payment && !item.isCompleted && (
                <button className="sm:min-w-48 py-2 border border-red-500 rounded text-red-500">
                  Appointment cancelled
                </button>
              )}
              {item.cancelled && item.payment && !item.isCompleted && (
                <button
                  onClick={() => router.push(`/appointment/${item.docData._id}?rescheduleId=${item._id}`)}
                  className="sm:min-w-48 py-2 border border-orange-500 rounded text-orange-500 hover:bg-orange-500 hover:text-white transition-all duration-300 cursor-pointer"
                >
                  Reschedule appointment
                </button>
              )}
            </div>
          </div>
        )))}
      </div>

      {/* Records Modal */}
      {showRecords && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Consultation Records</h2>
                    <p className="text-gray-500 text-sm">Provided by Dr. {showRecords.docData.name}</p>
                  </div>
                </div>
                <button onClick={() => setShowRecords(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l18 18" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Clinical Notes</h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {showRecords.notes || 'No notes provided for this session.'}
                  </p>
                </div>

                <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 space-y-3">
                  <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider">Prescription & Advice</h3>
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap font-medium">
                    {showRecords.prescription || 'No prescription provided.'}
                  </p>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => window.print()}
                  className="w-full h-12 bg-gray-900 text-white rounded-2xl font-semibold hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rating & Review Modal */}
      {ratingAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl transition-all scale-100 hover:scale-[1.01] duration-300">
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-500 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Rate & Review Doctor</h2>
                    <p className="text-gray-500 text-sm">Dr. {ratingAppointment.docData.name}</p>
                  </div>
                </div>
                <button onClick={() => setRatingAppointment(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l18 18" />
                  </svg>
                </button>
              </div>

              {/* Stars Selection */}
              <div className="flex flex-col items-center justify-center py-4 bg-amber-50/50 rounded-2xl border border-amber-100/50 space-y-2">
                <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Tap to select rating</span>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingValue(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      className="p-1 transition-transform hover:scale-125 duration-200 cursor-pointer"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-9 w-9 ${(hoverRating !== null ? star <= hoverRating : star <= ratingValue) ? 'text-amber-400 fill-current' : 'text-gray-300'}`}
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>
                <span className="text-sm font-bold text-amber-800">
                  {ratingValue === 5 && 'Excellent (5/5)'}
                  {ratingValue === 4 && 'Very Good (4/5)'}
                  {ratingValue === 3 && 'Good (3/5)'}
                  {ratingValue === 2 && 'Fair (2/5)'}
                  {ratingValue === 1 && 'Poor (1/5)'}
                </span>
              </div>

              {/* Comment field */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 block">Share your feedback</label>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Tell us about your consultation experience..."
                  rows={4}
                  className="w-full p-4 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all placeholder:text-gray-400 bg-gray-50/50"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setRatingAppointment(null)}
                  className="flex-1 h-12 border border-gray-200 text-gray-700 rounded-2xl font-semibold hover:bg-gray-50 transition-all flex items-center justify-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmittingRating}
                  onClick={submitDoctorRating}
                  className={`flex-1 h-12 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${isSubmittingRating ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isSubmittingRating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    'Submit Feedback'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAppointments;

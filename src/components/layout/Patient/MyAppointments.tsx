"use client";

import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

import { AppContext } from '@/context/AppContext';
import type { IPatientAppContext } from '@/models/patient';
import type { IAppointment } from '@/models/appointment';
import { smartApi } from '@/utils/smartApi';


const MyAppointments = () => {
  const { token, userData } = useContext(AppContext) as IPatientAppContext;

   const [appointments, setAppointments] = useState<IAppointment[]>([]);
  const [payment, setPayment] = useState<string>('');
  const router = useRouter();

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
    
    // Parse time (assuming format like "10:00 AM" or "2:30 PM")
    const timeMatch = slotTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!timeMatch) return { canJoin: false, reason: 'invalid' };
    
    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const period = timeMatch[3].toUpperCase();
    
    // Convert to 24-hour format
    if (period === 'AM' && hours === 12) {
      hours = 0;
    } else if (period === 'PM' && hours !== 12) {
      hours += 12;
    }
    
    // Create appointment date
    const appointmentDate = new Date(year, month, day, hours, minutes);
    const now = new Date();
    
    // Calculate difference in milliseconds
    const diffMs = appointmentDate.getTime() - now.getTime();
    
    // Convert to hours
    const diffHours = diffMs / (60 * 60 * 1000);
    
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
      <p className="pb-3 mt-12 text-lg font-medium text-gray-600 border-b">My appointments</p>
      <div className="">
        {appointments.map((item: IAppointment, index: number) => (
          <div
            key={index}
            className="grid grid-cols-[1fr_2fr] gap-4 sm:flex sm:gap-6 py-4 border-b"
          >
            <div>
              <img className="doctor-profile-image w-36 h-48 rounded" src={item.docData.image} alt={`Dr. ${item.docData.name}`} />
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
                  return 'border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white cursor-pointer';
                };

                return (
                  <button
                    onClick={() => {
                      if (joinStatus.canJoin) {
                        window.open(`/meeting/${item.meetingId}?name=${userData.name}`, '_blank');
                      }
                    }}
                    disabled={!joinStatus.canJoin}
                    className={`sm:min-w-48 py-2 border rounded transition-all duration-300 flex items-center justify-center gap-2 ${getButtonStyles()}`}
                    title={getTooltipMessage()}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
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
                <button className="sm:min-w-48 py-2 border border-green-500 rounded text-green-500">
                  Accepted
                </button>
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
        ))}
      </div>
    </div>
  );
};

export default MyAppointments;

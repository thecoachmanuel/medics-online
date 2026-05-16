"use client";

import { useEffect, useContext } from 'react';

import { AdminContext } from '@/context/AdminContext';
import { AppContext } from '@/context/AppContext';
import type { IAdminContext } from '@/models/doctor';
import type { IPatientAppContext } from '@/models/patient';
import type { IAppointment } from '@/models/appointment';

const AllAppointments = () => {
  const { aToken, appointments, cancelAppointment, getAllAppointments } = useContext(
    AdminContext
  ) as IAdminContext;
  const { slotDateFormat, calculateAge, currencySymbol } = useContext(
    AppContext
  ) as IPatientAppContext;

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

  useEffect(() => {
    if (aToken) {
      getAllAppointments();
    }
  }, [aToken]);

  return (
    <div className="w-full max-w-6xl m-5 ">
      <p className="mb-3 text-lg font-medium">All Appointments</p>

      <div className="bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll">
        <div className="hidden sm:grid grid-cols-[0.5fr_2fr_0.5fr_1fr_2fr_2fr_1fr_1fr] grid-flow-col py-3 px-6 border-b">
          <p>#</p>
          <p>Patient</p>
          <p>Age</p>
          <p>Date & Time</p>
          <p>Doctor</p>
          <p>Vitals</p>
          <p>Fees</p>
          <p>Action</p>
        </div>
        {appointments.map((item: IAppointment, index: number) => (
          <div
            className="flex flex-wrap justify-between max-sm:gap-2 sm:grid sm:grid-cols-[0.5fr_2fr_0.5fr_1fr_2fr_2fr_1fr_1fr] items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50"
            key={index}
          >
            <p className="max-sm:hidden">{index + 1}</p>
            <div className="flex items-center gap-2">
              <img src={item.userData.image} className="w-8 h-8 rounded-full object-cover" alt={item.userData.name} />
              <p>{item.userData.name}</p>
            </div>
            <p className="max-sm:hidden">{calculateAge(item.userData.dob)}</p>
            <p>
              {slotDateFormat(item.slotDate)}, {item.slotTime}
            </p>
            <div className="flex items-center gap-2">
              <img src={item.docData.image} className="w-8 h-8 rounded-full object-cover bg-gray-200" alt={`Dr. ${item.docData.name}`} />
              <p>{item.docData.name}</p>
            </div>
            <div className="py-1">
              {item.vitals ? (
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 flex items-center justify-center bg-red-100 rounded-full">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4 text-red-600"
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
                      <p className="text-sm font-medium">
                        {item.vitals.bpm || '-'} <span className="text-xs">BPM</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 flex items-center justify-center bg-blue-100 rounded-full">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4 text-blue-600"
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
                      <p className="text-xs text-gray-500">SpO2</p>
                      <p className="text-sm font-medium">
                        {item.vitals.spo2 || '-'} <span className="text-xs">%</span>
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <span className="text-gray-400 text-xs flex items-center justify-center h-full">
                  No vitals
                </span>
              )}
            </div>
            <p>
              {currencySymbol}
              {item.amount}
            </p>
            {item.cancelled ? (
              <p className="text-red-400 text-xs font-medium">Cancelled</p>
            ) : item.isCompleted ? (
              <div className="flex flex-col gap-1">
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
                      return 'Meeting will be available closer to appointment time';
                    } else if (joinStatus.reason === 'past') {
                      return 'This meeting is over';
                    }
                    return 'Join the meeting';
                  };

                  const getButtonText = () => {
                    if (joinStatus.reason === 'past') {
                      return 'Over';
                    } else if (joinStatus.reason === 'future') {
                      return 'Soon';
                    }
                    return 'Join';
                  };

                  const getButtonStyles = () => {
                    if (joinStatus.reason === 'past') {
                      return 'bg-gray-300 text-gray-500 cursor-not-allowed';
                    } else if (joinStatus.reason === 'future') {
                      return 'bg-orange-200 text-orange-600 cursor-not-allowed';
                    }
                    return 'bg-blue-500 text-white hover:bg-blue-600 cursor-pointer';
                  };

                  return (
                    <button
                      onClick={() => {
                        if (joinStatus.canJoin) {
                          window.open(`/meeting/${item.meetingId}?name=Admin`, '_blank');
                        }
                      }}
                      disabled={!joinStatus.canJoin}
                      className={`text-xs px-2 py-1 rounded transition-all duration-300 flex items-center justify-center gap-1 ${getButtonStyles()}`}
                      title={getTooltipMessage()}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      {getButtonText()}
                    </button>
                  );
                })()}
                <p className="text-green-500 text-xs font-medium">Accepted</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
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
                      return 'Meeting will be available closer to appointment time';
                    } else if (joinStatus.reason === 'past') {
                      return 'This meeting is over';
                    }
                    return 'Join the meeting';
                  };

                  const getButtonText = () => {
                    if (joinStatus.reason === 'past') {
                      return 'Over';
                    } else if (joinStatus.reason === 'future') {
                      return 'Soon';
                    }
                    return 'Join';
                  };

                  const getButtonStyles = () => {
                    if (joinStatus.reason === 'past') {
                      return 'bg-gray-300 text-gray-500 cursor-not-allowed';
                    } else if (joinStatus.reason === 'future') {
                      return 'bg-orange-200 text-orange-600 cursor-not-allowed';
                    }
                    return 'bg-blue-500 text-white hover:bg-blue-600 cursor-pointer';
                  };

                  return (
                    <button
                      onClick={() => {
                        if (joinStatus.canJoin) {
                          window.open(`/meeting/${item.meetingId}?name=Admin`, '_blank');
                        }
                      }}
                      disabled={!joinStatus.canJoin}
                      className={`text-xs px-2 py-1 rounded transition-all duration-300 flex items-center justify-center gap-1 ${getButtonStyles()}`}
                      title={getTooltipMessage()}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      {getButtonText()}
                    </button>
                  );
                })()}
                <img
                  onClick={() => cancelAppointment(item._id)}
                  className="w-10 cursor-pointer"
                  src={'/assets/cancel_icon.svg'}
                  alt=""
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllAppointments;

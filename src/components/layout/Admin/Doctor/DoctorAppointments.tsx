"use client";

import { useContext, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';

import { DoctorContext } from '@/context/DoctorContext';
import { AppContext } from '@/context/AppContext';
import type { IDoctorContext } from '@/models/doctor';
import type { IPatientAppContext } from '@/models/patient';
import type { IAppointment } from '@/models/appointment';
import { Video, Calendar, AlertTriangle } from 'lucide-react';

const DoctorAppointments = () => {
  const {
    dToken,
    appointments,
    getAppointments,
    cancelAppointment,
    completeAppointment,
    profileData,
    getProfileData
  } = useContext(DoctorContext) as IDoctorContext;
  const router = useRouter();
  
  const searchParams = useSearchParams();
  const filterParam = searchParams ? searchParams.get('filter') : 'all';
  const [filterType, setFilterType] = useState<'all' | 'latest'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'past' | 'cancelled'>('all');

  useEffect(() => {
    if (filterParam === 'latest') {
      setFilterType('latest');
    } else {
      setFilterType('all');
    }
  }, [filterParam]);

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

  const slicedAppointments = filterType === 'latest'
    ? [...appointments].sort((a, b) => b.date - a.date).slice(0, 10)
    : appointments;

  const displayedAppointments = slicedAppointments.filter((item) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'cancelled') return item.cancelled;
    const isPast = item.isCompleted || isSlotPast(item.slotDate, item.slotTime);
    if (statusFilter === 'past') return isPast;
    return !item.cancelled && !item.isCompleted && !isPast;
  });

  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [suggestedRebookTime, setSuggestedRebookTime] = useState('');

  const handleCancelSubmit = async () => {
    if (!cancellingId) return;
    if (!cancellationReason.trim()) {
      toast.warning('Please enter a cancellation reason');
      return;
    }
    if (!suggestedRebookTime.trim()) {
      toast.warning('Please enter a suggested rebook time');
      return;
    }

    try {
      await cancelAppointment(cancellingId, cancellationReason, suggestedRebookTime);
      setCancellingId(null);
      setCancellationReason('');
      setSuggestedRebookTime('');
    } catch (err) {
      console.error(err);
    }
  };

  const { slotDateFormat, calculateAge, currencySymbol } = useContext(
    AppContext
  ) as IPatientAppContext;

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

  useEffect(() => {
    if (dToken) {
      getAppointments();
      getProfileData();
    }
  }, [dToken]);

  return (
    <div className="w-full max-w-6xl m-5 ">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-xl font-bold text-gray-800">
            {filterType === 'latest' ? 'Latest Bookings' : 'All Bookings'}
          </p>
          <p className="text-sm text-gray-500">
            {filterType === 'latest' ? 'Showing your most recent 10 consultations' : 'Showing all your registered patient consultations'}
          </p>
        </div>
        
        {/* Toggle Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 shadow-sm self-start md:self-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${filterType === 'all' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
          >
            All Bookings ({appointments.length})
          </button>
          <button
            onClick={() => setFilterType('latest')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${filterType === 'latest' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
          >
            Latest Bookings (Last 10)
          </button>
        </div>
      </div>

      {/* Status Sub-Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1.5 scrollbar-thin">
        {(['all', 'upcoming', 'past', 'cancelled'] as const).map((status) => {
          const count = slicedAppointments.filter((item) => {
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

      <div className="bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll">
        <div className="max-sm:hidden grid grid-cols-[0.5fr_2fr_0.5fr_1fr_2fr_2fr_1fr_1fr] gap-1 py-3 px-6 border-b">
          <p>#</p>
          <p>Patient</p>
          <p>Payment</p>
          <p>Age</p>
          <p>Date & Time</p>
          <p>Vitals</p>
          <p>Fees</p>
          <p>Action</p>
        </div>
        {displayedAppointments.map((item: IAppointment, index: number) => (
          <div
            className="flex flex-wrap justify-between max-sm:gap-5 max-sm:text-base sm:grid grid-cols-[0.5fr_2fr_0.5fr_1fr_2fr_2fr_1fr_1fr] gap-1 items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50"
            key={index}
          >
            <p className="max-sm:hidden">{index}</p>
            <div className="flex items-center gap-2">
              <img src={item.userData.image} className="profile-image w-8 h-8 rounded-full" alt={item.userData.name} />{' '}
              <p>{item.userData.name}</p>
            </div>
            <div>
              <p className="text-xs inline border border-primary px-2 rounded-full">
                {item.payment ? 'Online' : 'CASH'}
              </p>
            </div>
            <p className="max-sm:hidden">{calculateAge(item.userData.dob)}</p>
            <p>
              {slotDateFormat(item.slotDate)}, {item.slotTime}
            </p>
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
                    return 'bg-primary text-white hover:bg-primary/90 shadow-md hover:shadow-lg scale-100 hover:scale-[1.05] cursor-pointer border-none font-bold';
                  };

                  return (
                    <button
                      onClick={() => {
                        console.log('🔘 Join button clicked. ID:', item.meetingId, 'canJoin:', joinStatus.canJoin, 'reason:', joinStatus.reason);
                        if (joinStatus.canJoin) {
                          router.push(`/meeting/${item.meetingId}?name=${encodeURIComponent(profileData?.name || 'Doctor')}`);
                        } else {
                          toast.info(`Meeting available later: ${joinStatus.reason}`);
                        }
                      }}
                      aria-label={getTooltipMessage()}
                      className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm ${getButtonStyles()}`}
                      title={getTooltipMessage()}
                    >
                      <Video className="w-4 h-4" />
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
                    return 'bg-primary text-white hover:bg-primary/90 shadow-md hover:shadow-lg scale-100 hover:scale-[1.05] cursor-pointer border-none font-bold';
                  };

                  return (
                    <button
                      onClick={() => {
                        console.log('🔘 Join button clicked (occ 2). ID:', item.meetingId, 'canJoin:', joinStatus.canJoin, 'reason:', joinStatus.reason);
                        if (joinStatus.canJoin) {
                          router.push(`/meeting/${item.meetingId}?name=${encodeURIComponent(profileData?.name || 'Doctor')}`);
                        } else {
                          toast.info(`Meeting available later: ${joinStatus.reason}`);
                        }
                      }}
                      aria-label={getTooltipMessage()}
                      className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm ${getButtonStyles()}`}
                      title={getTooltipMessage()}
                    >
                      <Video className="w-4 h-4" />
                      {getButtonText()}
                    </button>
                  );
                })()}
                <div className="flex">
                  <img
                    onClick={() => setCancellingId(item._id)}
                    className="w-10 cursor-pointer"
                    src={'/assets/cancel_icon.svg'}
                    alt=""
                  />
                  <img
                    onClick={() => completeAppointment(item._id)}
                    className="w-10 cursor-pointer"
                    src={'/assets/tick_icon.svg'}
                    alt=""
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Cancellation Reason Modal */}
      {cancellingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-gray-100 rounded-2xl shadow-2xl p-6 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500 animate-pulse">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">Cancel Appointment</h3>
                <p className="text-xs text-gray-500">Provide reason and suggested rebook time</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Cancellation Reason *</label>
                <textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="e.g., Unforeseen schedule conflict, medical emergency..."
                  className="w-full min-h-[90px] border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-gray-800 placeholder-gray-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                  <Calendar size={13} className="text-gray-400" />
                  Suggested Rebook Time *
                </label>
                <input
                  type="text"
                  value={suggestedRebookTime}
                  onChange={(e) => setSuggestedRebookTime(e.target.value)}
                  placeholder="e.g., Tomorrow at 2:00 PM, or next Monday morning"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-800 placeholder-gray-400"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setCancellingId(null);
                  setCancellationReason('');
                  setSuggestedRebookTime('');
                }}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={handleCancelSubmit}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors shadow-md shadow-red-500/10"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAppointments;

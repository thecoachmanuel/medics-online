"use client";

import { useContext, useEffect } from 'react';

import { DoctorContext } from '@/context/DoctorContext';
import { AppContext } from '@/context/AppContext';
import type { IDoctorContext } from '@/models/doctor';
import type { IPatientAppContext } from '@/models/patient';
import type { IAppointment } from '@/models/appointment';

const DoctorDashboard = () => {
  const { dToken, dashData, getDashData, cancelAppointment, completeAppointment } = useContext(
    DoctorContext
  ) as IDoctorContext;
  const { slotDateFormat, currencySymbol } = useContext(AppContext) as IPatientAppContext;

  useEffect(() => {
    if (dToken) {
      getDashData();
    }
  }, [dToken]);

  return (
    dashData && (
      <div className="m-5">
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all">
            <img className="w-14" src={'/assets/earning_icon.svg'} alt="" />
            <div>
              <p className="text-xl font-semibold text-gray-600">
                {currencySymbol} {dashData.earnings}
              </p>
              <p className="text-gray-400">Earnings</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all">
            <img className="w-14" src={'/assets/appointments_icon.svg'} alt="" />
            <div>
              <p className="text-xl font-semibold text-gray-600">{dashData.appointments}</p>
              <p className="text-gray-400">Appointments</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all">
            <img className="w-14" src={'/assets/patients_icon.svg'} alt="" />
            <div>
              <p className="text-xl font-semibold text-gray-600">{dashData.patients}</p>
              <p className="text-gray-400">Patients</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 mt-10 overflow-hidden shadow-sm">
          <div className="flex items-center gap-2.5 px-6 py-4 bg-gray-50 border-b border-gray-200">
            <img src={'/assets/list_icon.svg'} className="w-5 h-5" alt="" />
            <p className="font-bold text-gray-800">Latest Bookings</p>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              {/* Table Header */}
              <div className="grid grid-cols-[0.5fr_3fr_3fr_2.5fr] gap-4 py-3 px-6 bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <p>#</p>
                <p>Patient</p>
                <p>Date & Time</p>
                <p className="text-right">Action</p>
              </div>
              
              {/* Table Body */}
              <div className="divide-y divide-gray-100">
                {dashData.latestAppointments.slice(0, 5).map((item: IAppointment, index: number) => (
                  <div className="grid grid-cols-[0.5fr_3fr_3fr_2.5fr] gap-4 items-center px-6 py-4 hover:bg-gray-50 transition-colors text-sm text-gray-600" key={index}>
                    <p className="font-semibold text-gray-400">{index + 1}</p>
                    
                    {/* Patient info */}
                    <div className="flex items-center gap-3">
                      <img className="rounded-full w-9 h-9 object-cover border border-gray-200" src={item.userData.image} alt={item.userData.name} />
                      <div>
                        <p className="text-gray-800 font-bold">{item.userData.name}</p>
                        <p className="text-xs text-gray-400">Patient</p>
                      </div>
                    </div>

                    {/* Date Time */}
                    <div>
                      <p className="font-semibold text-gray-700">{slotDateFormat(item.slotDate)}</p>
                      <p className="text-xs text-gray-400">{item.slotTime}</p>
                    </div>

                    {/* Action / Status */}
                    <div className="flex items-center justify-end gap-3">
                      {item.cancelled ? (
                        <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-semibold border border-red-100">
                          Cancelled
                        </span>
                      ) : item.isCompleted ? (
                        <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-semibold border border-green-100">
                          Accepted
                        </span>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => cancelAppointment(item._id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancel
                          </button>
                          <button
                            onClick={() => completeAppointment(item._id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-600 border border-green-100 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                            Accept
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  );
};

export default DoctorDashboard;

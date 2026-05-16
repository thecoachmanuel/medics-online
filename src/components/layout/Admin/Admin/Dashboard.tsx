"use client";

import { useContext, useEffect, useState } from 'react';

import { AdminContext } from '@/context/AdminContext';
import { AppContext } from '@/context/AppContext';
import type { IAdminContext } from '@/models/doctor';
import type { IPatientAppContext } from '@/models/patient';
import type { IAppointment } from '@/models/appointment';

const Dashboard = () => {
  const { aToken, getDashData, cancelAppointment, dashData } = useContext(
    AdminContext
  ) as IAdminContext;
  const { slotDateFormat } = useContext(AppContext) as IPatientAppContext;
  const [showRecords, setShowRecords] = useState<IAppointment | null>(null);

  useEffect(() => {
    if (aToken) {
      getDashData();
    }
  }, [aToken]);

  return (
    dashData && (
      <div className="m-5">
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all">
            <img className="w-14" src={'/assets/doctor_icon.svg'} alt="" />
            <div>
              <p className="text-xl font-semibold text-gray-600">{dashData.doctors}</p>
              <p className="text-gray-400">Doctors</p>
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

        <div className="bg-white">
          <div className="flex items-center gap-2.5 px-4 py-4 mt-10 rounded-t border">
            <img src={'/assets/list_icon.svg'} alt="" />
            <p className="font-semibold">Latest Bookings</p>
          </div>

          <div className="pt-4 border border-t-0">
            {dashData.latestAppointments.slice(0, 5).map((item: IAppointment, index: number) => (
              <div className="flex items-center px-6 py-3 gap-3 hover:bg-gray-100" key={index}>
                <img className="rounded-full w-10 h-10 object-cover border" src={item.docData.image} alt="" />
                <div className="flex-1 text-sm">
                  <p className="text-gray-800 font-medium">{item.docData.name}</p>
                  <p className="text-gray-600 ">Booking on {slotDateFormat(item.slotDate)} at {item.slotTime}</p>
                </div>
                {item.cancelled ? (
                  <p className="text-red-400 text-xs font-medium">Cancelled</p>
                ) : item.isCompleted ? (
                  <div className="flex items-center gap-2">
                    <p className="text-green-500 text-xs font-medium">Completed</p>
                    <button 
                      onClick={() => setShowRecords(item)}
                      className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-100 hover:bg-blue-100 transition-colors"
                    >
                      View Records
                    </button>
                  </div>
                ) : (
                  <img
                    onClick={() => cancelAppointment(item._id)}
                    className="w-10 cursor-pointer"
                    src={'/assets/cancel_icon.svg'}
                    alt=""
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Records Modal for Admin */}
        {showRecords && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-2xl bg-white rounded-2xl overflow-hidden shadow-xl">
              <div className="p-6 border-b flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Consultation History</h3>
                  <p className="text-sm text-gray-500">Patient: {showRecords.userData.name} | Doctor: {showRecords.docData.name}</p>
                </div>
                <button onClick={() => setShowRecords(null)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">Doctor's Notes</label>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 text-sm text-gray-700 whitespace-pre-wrap">
                    {showRecords.notes || 'No notes available.'}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-blue-400 uppercase">Prescription</label>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 text-sm text-gray-800 font-medium whitespace-pre-wrap">
                    {showRecords.prescription || 'No prescription available.'}
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50 border-t flex justify-end">
                <button onClick={() => setShowRecords(null)} className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
                  Close Review
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  );
};

export default Dashboard;

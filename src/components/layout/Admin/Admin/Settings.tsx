"use client";

import { useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { Database, AlertTriangle, Trash2, CheckCircle } from 'lucide-react';

import { AdminContext } from '@/context/AdminContext';
import type { IAdminContext } from '@/models/doctor';
import { smartApi } from '@/utils/smartApi';

const AdminSettings = () => {
  const { aToken } = useContext(AdminContext) as IAdminContext;

  const [target, setTarget] = useState<'doctors' | 'appointments' | 'patients'>('appointments');
  const [confirmText, setConfirmText] = useState('');
  const [isClearing, setIsClearing] = useState(false);

  const handleClearData = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!aToken) {
      return toast.error('Unauthorized access');
    }

    if (confirmText !== 'CLEAR') {
      return toast.warning("Please type 'CLEAR' exactly in the input box to authorize deletion");
    }

    const confirmTwice = window.confirm(
      `⚠️ WARNING: This will permanently erase all data in the ${target.toUpperCase()} collection. This action is 100% IRREVERSIBLE. Are you absolutely sure?`
    );
    if (!confirmTwice) return;

    try {
      setIsClearing(true);
      const data = await smartApi.post(
        '/api/admin/clear-data',
        { target },
        { headers: { aToken } }
      ) as { success: boolean; message: string };

      if (data.success) {
        toast.success(data.message || 'Selected data cleared successfully!');
        setConfirmText('');
      } else {
        toast.error(data.message || 'Failed to clear data');
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred while clearing data');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="m-5 max-w-3xl">
      <div className="flex items-center gap-2 mb-1">
        <Database className="w-6 h-6 text-primary" />
        <h1 className="text-xl font-bold text-gray-800">System Maintenance & settings</h1>
      </div>
      <p className="text-xs text-gray-500 mb-6">
        Perform advanced administrative tasks and clear site records cleanly.
      </p>

      {/* Warning Card */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6 flex items-start gap-4">
        <AlertTriangle className="w-10 h-10 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-bold text-amber-800">Irreversible Action Warning</h3>
          <p className="text-xs text-amber-700 mt-1 leading-relaxed">
            Clearing collections will permanently purge records from the database. 
            Clearing doctors or patients will also remove their associated appointments automatically to maintain system-wide database integrity. 
            Please use this utility with extreme caution.
          </p>
        </div>
      </div>

      {/* Main Settings Card */}
      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-red-500" />
          Clear Site Collections
        </h2>

        <form onSubmit={handleClearData} className="space-y-6">
          {/* Target Select */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Select Data Collection to Clear
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'appointments', label: 'Bookings', desc: 'Clear all appointments' },
                { value: 'doctors', label: 'Doctors', desc: 'Clear all doctors & payouts' },
                { value: 'patients', label: 'Patients', desc: 'Clear all patients & accounts' }
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setTarget(item.value as any)}
                  className={`p-4 border rounded-xl text-left cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                    target === item.value
                      ? 'border-red-500 bg-red-50/20 ring-1 ring-red-500'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span className={`text-sm font-bold ${target === item.value ? 'text-red-600' : 'text-gray-700'}`}>
                    {item.label}
                  </span>
                  <span className="text-[10px] text-gray-400 mt-1">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Warning Note */}
          <div className="text-xs text-gray-500 leading-relaxed bg-gray-50 p-3 rounded-lg border">
            {target === 'appointments' && (
              <span>💡 <strong>Bookings</strong> target clears only appointment documents. Doctors and patients accounts remain intact.</span>
            )}
            {target === 'doctors' && (
              <span>💡 <strong>Doctors</strong> target clears all registered doctors, bank coordinates, payout requests, and all their scheduled appointments.</span>
            )}
            {target === 'patients' && (
              <span>💡 <strong>Patients</strong> target clears all registered patient/user accounts, along with all their scheduled appointments.</span>
            )}
          </div>

          {/* Confirm Field */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              To confirm, type <span className="font-bold text-red-600">CLEAR</span> below
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type CLEAR to authorize"
              className="w-full max-w-md px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-red-500 font-bold"
              required
            />
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isClearing || confirmText !== 'CLEAR'}
              className={`px-6 py-2.5 bg-red-600 text-white font-semibold rounded-lg shadow hover:bg-red-700 transition-colors flex items-center gap-2 cursor-pointer text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isClearing ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                  Purging Data...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Purge Selected Data
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminSettings;

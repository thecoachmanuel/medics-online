"use client";

import { useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { TrendingUp, Settings, Trophy, BadgeCheck, Crown } from 'lucide-react';

import { AdminContext } from '@/context/AdminContext';
import type { IAdminContext } from '@/models/doctor';
import { smartApi } from '@/utils/smartApi';

interface LeaderboardEntry {
  _id: string;
  name: string;
  image: string;
  speciality: string;
  isVerified: boolean;
  grossEarnings: number;
  adminCommission: number;
  netShare: number;
  bookingsCount: number;
}

const AdminCommission = () => {
  const { aToken } = useContext(AdminContext) as IAdminContext;

  const [commissionRate, setCommissionRate] = useState(20);
  const [editRate, setEditRate] = useState('20');
  const [isEditing, setIsEditing] = useState(false);
  const [savingRate, setSavingRate] = useState(false);
  const [rateLoading, setRateLoading] = useState(true);

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);

  useEffect(() => {
    if (aToken) {
      fetchCommissionRate();
      fetchLeaderboard();
    }
  }, [aToken]);

  const fetchCommissionRate = async () => {
    try {
      setRateLoading(true);
      const data = await smartApi.post('/api/admin/get-commission-rate', {}, {
        headers: { aToken }
      }) as { success: boolean; commissionRate: number };
      if (data.success) {
        setCommissionRate(data.commissionRate);
        setEditRate(String(data.commissionRate));
      }
    } catch (error) {
      console.error('Error fetching commission rate:', error);
    } finally {
      setRateLoading(false);
    }
  };

  const saveCommissionRate = async () => {
    const rate = parseFloat(editRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      return toast.warning('Commission rate must be between 0 and 100');
    }
    setSavingRate(true);
    try {
      const data = await smartApi.post('/api/admin/set-commission-rate', {
        commissionRate: rate
      }, { headers: { aToken } }) as { success: boolean; message: string };
      if (data.success) {
        toast.success(data.message);
        setCommissionRate(rate);
        setIsEditing(false);
        fetchLeaderboard(); // Refresh leaderboard with new rate
      } else {
        toast.error(data.message);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update rate');
    } finally {
      setSavingRate(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      setLeaderboardLoading(true);
      const data = await smartApi.post('/api/admin/doctor-leaderboard', {}, {
        headers: { aToken }
      }) as { success: boolean; leaderboard: LeaderboardEntry[] };
      if (data.success) {
        setLeaderboard(data.leaderboard);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  // Totals
  const totalGross = leaderboard.reduce((a, b) => a + b.grossEarnings, 0);
  const totalCommission = leaderboard.reduce((a, b) => a + b.adminCommission, 0);
  const totalDoctorNet = leaderboard.reduce((a, b) => a + b.netShare, 0);
  const totalBookings = leaderboard.reduce((a, b) => a + b.bookingsCount, 0);

  const rankMedal = (index: number) => {
    if (index === 0) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (index === 1) return <span className="text-sm font-bold text-gray-400">🥈</span>;
    if (index === 2) return <span className="text-sm font-bold text-amber-600">🥉</span>;
    return <span className="text-xs font-bold text-gray-400 w-5 text-center">{index + 1}</span>;
  };

  return (
    <div className="m-5 max-w-6xl">
      <h1 className="text-lg font-bold text-gray-800 mb-1">Commission & Leaderboard</h1>
      <p className="text-xs text-gray-500 mb-6">Manage your platform commission rate and track top earning doctors.</p>

      {/* Commission Rate Card */}
      <div className="bg-white border rounded-xl p-5 mb-6">
        <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4">
          <Settings className="w-4 h-4 text-primary" />
          Global Commission Rate
        </h2>

        {rateLoading ? (
          <p className="text-sm text-gray-400">Loading commission rate...</p>
        ) : (
          <div className="flex items-center gap-4">
            {isEditing ? (
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="number"
                    value={editRate}
                    onChange={(e) => setEditRate(e.target.value)}
                    className="w-24 px-3 py-2 border rounded-lg text-sm font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                    min={0}
                    max={100}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">%</span>
                </div>
                <button
                  onClick={saveCommissionRate}
                  disabled={savingRate}
                  className="px-4 py-2 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 cursor-pointer disabled:opacity-60"
                >
                  {savingRate ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => { setIsEditing(false); setEditRate(String(commissionRate)); }}
                  className="px-4 py-2 border text-xs font-semibold rounded-lg text-gray-500 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-r from-primary to-indigo-600 text-white px-6 py-3 rounded-xl">
                  <p className="text-[10px] opacity-80 font-semibold">CURRENT RATE</p>
                  <p className="text-2xl font-black">{commissionRate}%</p>
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 border border-primary text-primary text-xs font-semibold rounded-lg hover:bg-primary hover:text-white transition-colors cursor-pointer"
                >
                  Edit Rate
                </button>
              </div>
            )}
          </div>
        )}

        <p className="text-[11px] text-gray-400 mt-3">
          This percentage is automatically deducted from every doctor&apos;s gross earnings before their net share is calculated.
        </p>
      </div>

      {/* Totals Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white border rounded-xl p-4">
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Platform Revenue</p>
          <p className="text-lg font-bold text-gray-800 mt-1">₦{totalGross.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">Your Commission</p>
          <p className="text-lg font-bold mt-1">₦{totalCommission.toLocaleString()}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Doctors&apos; Net</p>
          <p className="text-lg font-bold text-gray-800 mt-1">₦{totalDoctorNet.toLocaleString()}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Total Bookings</p>
          <p className="text-lg font-bold text-gray-800 mt-1">{totalBookings}</p>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white border rounded-xl p-5">
        <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4">
          <Trophy className="w-4 h-4 text-yellow-500" />
          Doctor Earnings Leaderboard
        </h2>

        {leaderboardLoading ? (
          <p className="text-sm text-gray-400 text-center py-8">Loading leaderboard...</p>
        ) : leaderboard.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No doctor earnings data yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-gray-400 uppercase border-b">
                  <th className="text-left py-2 font-semibold w-10">Rank</th>
                  <th className="text-left py-2 font-semibold">Doctor</th>
                  <th className="text-left py-2 font-semibold">Bookings</th>
                  <th className="text-right py-2 font-semibold">Gross Earnings</th>
                  <th className="text-right py-2 font-semibold">Your Commission</th>
                  <th className="text-right py-2 font-semibold">Doctor Net</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((doc, idx) => (
                  <tr key={doc._id} className={`border-b last:border-0 hover:bg-gray-50 ${idx < 3 ? 'bg-yellow-50/30' : ''}`}>
                    <td className="py-3 text-center">
                      {rankMedal(idx)}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <img src={doc.image} alt="" className="w-9 h-9 rounded-full object-cover border" />
                        <div>
                          <p className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                            {doc.name}
                            {doc.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-blue-500" />}
                          </p>
                          <p className="text-[10px] text-gray-400">{doc.speciality}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-xs text-gray-600">{doc.bookingsCount}</td>
                    <td className="py-3 text-right font-bold text-gray-800">₦{doc.grossEarnings.toLocaleString()}</td>
                    <td className="py-3 text-right font-semibold text-green-600">₦{doc.adminCommission.toLocaleString()}</td>
                    <td className="py-3 text-right text-gray-600">₦{doc.netShare.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 font-bold text-xs">
                  <td className="py-3" colSpan={2}>TOTALS</td>
                  <td className="py-3">{totalBookings}</td>
                  <td className="py-3 text-right">₦{totalGross.toLocaleString()}</td>
                  <td className="py-3 text-right text-green-600">₦{totalCommission.toLocaleString()}</td>
                  <td className="py-3 text-right">₦{totalDoctorNet.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCommission;

"use client";

import { useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Wallet, Landmark, Send, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

import { DoctorContext } from '@/context/DoctorContext';
import type { IDoctorContext } from '@/models/doctor';
import { smartApi } from '@/utils/smartApi';

interface Payout {
  _id: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
}

const DoctorPayout = () => {
  const { dToken, profileData, getProfileData, dashData, getDashData } = useContext(DoctorContext) as IDoctorContext;
  
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [bankSaving, setBankSaving] = useState(false);

  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);

  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [payoutsLoading, setPayoutsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (dToken) {
      getProfileData();
      getDashData();
      fetchPayouts();
    }
  }, [dToken]);

  useEffect(() => {
    if (profileData) {
      setBankName(profileData.bankName || '');
      setAccountNumber(profileData.accountNumber || '');
      setAccountName(profileData.accountName || '');
    }
  }, [profileData]);

  const fetchPayouts = async () => {
    try {
      setPayoutsLoading(true);
      const data = await smartApi.post('/api/doctor/get-payouts', {}, {
        headers: { dToken }
      }) as { success: boolean; payouts: Payout[] };
      if (data.success) {
        setPayouts(data.payouts);
      }
    } catch (error) {
      console.error('Error fetching payouts:', error);
    } finally {
      setPayoutsLoading(false);
    }
  };

  const saveBankDetails = async () => {
    if (!bankName.trim() || !accountNumber.trim() || !accountName.trim()) {
      return toast.warning('Please fill in all bank detail fields');
    }
    setBankSaving(true);
    try {
      const data = await smartApi.post('/api/doctor/update-bank-details', {
        bankName, accountNumber, accountName
      }, { headers: { dToken } }) as { success: boolean; message: string };
      if (data.success) {
        toast.success(data.message);
        getProfileData();
      } else {
        toast.error(data.message);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save bank details');
    } finally {
      setBankSaving(false);
    }
  };

  const submitPayoutRequest = async () => {
    const amt = parseFloat(payoutAmount);
    if (isNaN(amt) || amt <= 0) {
      return toast.warning('Please enter a valid withdrawal amount');
    }
    setPayoutLoading(true);
    try {
      const data = await smartApi.post('/api/doctor/request-payout', {
        amount: amt
      }, { headers: { dToken } }) as { success: boolean; message: string };
      if (data.success) {
        toast.success(data.message);
        setPayoutAmount('');
        fetchPayouts();
        getDashData();
      } else {
        toast.error(data.message);
      }
    } catch (error: any) {
      toast.error(error.message || 'Payout request failed');
    } finally {
      setPayoutLoading(false);
    }
  };

  const filteredPayouts = filterStatus === 'all'
    ? payouts
    : payouts.filter(p => p.status === filterStatus);

  const hasBankDetails = profileData?.bankName && profileData?.accountNumber && profileData?.accountName;

  const statusIcon = (status: string) => {
    if (status === 'pending') return <Clock className="w-4 h-4 text-yellow-500" />;
    if (status === 'approved') return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      approved: 'bg-green-50 text-green-700 border-green-200',
      rejected: 'bg-red-50 text-red-700 border-red-200'
    };
    return `px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${colors[status] || ''}`;
  };

  return (
    <div className="m-5 max-w-5xl">
      <h1 className="text-lg font-bold text-gray-800 mb-1">Payouts & Withdrawals</h1>
      <p className="text-xs text-gray-500 mb-6">Manage your bank details and request earnings withdrawals.</p>

      {/* Balance Summary Cards */}
      {dashData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="bg-white border rounded-xl p-4">
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Gross Earnings</p>
            <p className="text-lg font-bold text-gray-800 mt-1">₦{dashData.earnings.toLocaleString()}</p>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Commission ({dashData.commissionRate}%)</p>
            <p className="text-lg font-bold text-red-500 mt-1">-₦{dashData.adminCommission.toLocaleString()}</p>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Net Share</p>
            <p className="text-lg font-bold text-gray-800 mt-1">₦{dashData.netShare.toLocaleString()}</p>
          </div>
          <div className="bg-gradient-to-br from-primary to-indigo-600 text-white rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">Available Balance</p>
            <p className="text-lg font-bold mt-1">₦{dashData.availableBalance.toLocaleString()}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Bank Details Card */}
        <div className="bg-white border rounded-xl p-5">
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4">
            <Landmark className="w-4 h-4 text-primary" />
            Permanent Bank Details
          </h2>
          <p className="text-[11px] text-gray-400 mb-4">
            Save your bank details once — they will be automatically attached to all future payout requests.
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">Bank Name</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. First Bank, GTBank"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">Account Number</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="0123456789"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">Account Name</label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Full name on bank account"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <button
              onClick={saveBankDetails}
              disabled={bankSaving}
              className="w-full py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors cursor-pointer disabled:opacity-60"
            >
              {bankSaving ? 'Saving...' : 'Save Bank Details'}
            </button>
          </div>
        </div>

        {/* Request Payout Card */}
        <div className="bg-white border rounded-xl p-5">
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4">
            <Send className="w-4 h-4 text-primary" />
            Request Withdrawal
          </h2>

          {!hasBankDetails && (
            <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
              <p className="text-[11px] text-yellow-700">
                Please save your bank details first before requesting a payout.
              </p>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">Withdrawal Amount (₦)</label>
              <input
                type="number"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                disabled={!hasBankDetails}
              />
            </div>
            {hasBankDetails && (
              <div className="bg-gray-50 rounded-lg p-3 text-[11px] text-gray-500 space-y-1">
                <p><span className="font-semibold">Bank:</span> {profileData?.bankName}</p>
                <p><span className="font-semibold">Account:</span> {profileData?.accountNumber}</p>
                <p><span className="font-semibold">Name:</span> {profileData?.accountName}</p>
              </div>
            )}
            <button
              onClick={submitPayoutRequest}
              disabled={payoutLoading || !hasBankDetails}
              className="w-full py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors cursor-pointer disabled:opacity-60"
            >
              {payoutLoading ? 'Submitting...' : 'Submit Payout Request'}
            </button>
          </div>
        </div>
      </div>

      {/* Payout History */}
      <div className="bg-white border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-primary" />
            Withdrawal History
          </h2>
          <div className="flex gap-1">
            {['all', 'pending', 'approved', 'rejected'].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold border cursor-pointer transition-colors ${
                  filterStatus === s
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {payoutsLoading ? (
          <p className="text-sm text-gray-400 text-center py-8">Loading payouts...</p>
        ) : filteredPayouts.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No payout records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-gray-400 uppercase border-b">
                  <th className="text-left py-2 font-semibold">Date</th>
                  <th className="text-left py-2 font-semibold">Amount</th>
                  <th className="text-left py-2 font-semibold">Bank</th>
                  <th className="text-left py-2 font-semibold">Account</th>
                  <th className="text-left py-2 font-semibold">Status</th>
                  <th className="text-left py-2 font-semibold">Note</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayouts.map((p) => (
                  <tr key={p._id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3 text-gray-600 text-xs">
                      {new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3 font-bold text-gray-800">₦{p.amount.toLocaleString()}</td>
                    <td className="py-3 text-gray-600 text-xs">{p.bankName}</td>
                    <td className="py-3 text-gray-600 text-xs">{p.accountNumber}</td>
                    <td className="py-3">
                      <span className={statusBadge(p.status)}>
                        <span className="flex items-center gap-1">{statusIcon(p.status)} {p.status}</span>
                      </span>
                    </td>
                    <td className="py-3 text-xs text-gray-400 max-w-[150px] truncate">
                      {p.status === 'rejected' ? p.rejectionReason || '—' : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorPayout;

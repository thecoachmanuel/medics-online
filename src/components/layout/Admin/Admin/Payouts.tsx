"use client";

import { useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Banknote, Clock, CheckCircle2, XCircle, BadgeCheck, X } from 'lucide-react';

import { AdminContext } from '@/context/AdminContext';
import type { IAdminContext } from '@/models/doctor';
import { smartApi } from '@/utils/smartApi';

interface PayoutDoc {
  _id: string;
  name: string;
  image: string;
  speciality: string;
  isVerified?: boolean;
}

interface Payout {
  _id: string;
  docId: PayoutDoc;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
}

const AdminPayouts = () => {
  const { aToken } = useContext(AdminContext) as IAdminContext;

  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  const [reviewModal, setReviewModal] = useState<Payout | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (aToken) fetchPayouts();
  }, [aToken]);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const data = await smartApi.post('/api/admin/get-payouts', {}, {
        headers: { aToken }
      }) as { success: boolean; payouts: Payout[] };
      if (data.success) setPayouts(data.payouts);
    } catch (error) {
      console.error('Error fetching payouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (status: 'approved' | 'rejected') => {
    if (!reviewModal) return;
    if (status === 'rejected' && !rejectionReason.trim()) {
      return toast.warning('Please provide a rejection reason');
    }
    setProcessing(true);
    try {
      const data = await smartApi.post('/api/admin/review-payout', {
        payoutId: reviewModal._id,
        status,
        rejectionReason: status === 'rejected' ? rejectionReason : ''
      }, { headers: { aToken } }) as { success: boolean; message: string };
      if (data.success) {
        toast.success(data.message);
        setReviewModal(null);
        setRejectionReason('');
        fetchPayouts();
      } else {
        toast.error(data.message);
      }
    } catch (error: any) {
      toast.error(error.message || 'Review failed');
    } finally {
      setProcessing(false);
    }
  };

  const filteredPayouts = filterStatus === 'all'
    ? payouts
    : payouts.filter(p => p.status === filterStatus);

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      approved: 'bg-green-50 text-green-700 border-green-200',
      rejected: 'bg-red-50 text-red-700 border-red-200'
    };
    return `px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${colors[status] || ''}`;
  };

  const statusIcon = (status: string) => {
    if (status === 'pending') return <Clock className="w-3.5 h-3.5 text-yellow-500" />;
    if (status === 'approved') return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />;
    return <XCircle className="w-3.5 h-3.5 text-red-500" />;
  };

  // Summary stats
  const totalPending = payouts.filter(p => p.status === 'pending').reduce((a, b) => a + b.amount, 0);
  const totalApproved = payouts.filter(p => p.status === 'approved').reduce((a, b) => a + b.amount, 0);
  const totalRejected = payouts.filter(p => p.status === 'rejected').reduce((a, b) => a + b.amount, 0);

  return (
    <div className="m-5 max-w-6xl">
      <h1 className="text-lg font-bold text-gray-800 mb-1">Payout Management</h1>
      <p className="text-xs text-gray-500 mb-6">Review and process doctor withdrawal requests.</p>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white border rounded-xl p-4">
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Pending</p>
          <p className="text-lg font-bold text-yellow-600 mt-1">₦{totalPending.toLocaleString()}</p>
          <p className="text-[10px] text-gray-400">{payouts.filter(p => p.status === 'pending').length} requests</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Approved</p>
          <p className="text-lg font-bold text-green-600 mt-1">₦{totalApproved.toLocaleString()}</p>
          <p className="text-[10px] text-gray-400">{payouts.filter(p => p.status === 'approved').length} paid</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Rejected</p>
          <p className="text-lg font-bold text-red-500 mt-1">₦{totalRejected.toLocaleString()}</p>
          <p className="text-[10px] text-gray-400">{payouts.filter(p => p.status === 'rejected').length} declined</p>
        </div>
      </div>

      {/* Payouts Table */}
      <div className="bg-white border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <Banknote className="w-4 h-4 text-primary" />
            All Payout Requests
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

        {loading ? (
          <p className="text-sm text-gray-400 text-center py-8">Loading payouts...</p>
        ) : filteredPayouts.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No payout requests found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-gray-400 uppercase border-b">
                  <th className="text-left py-2 font-semibold">Doctor</th>
                  <th className="text-left py-2 font-semibold">Amount</th>
                  <th className="text-left py-2 font-semibold">Bank</th>
                  <th className="text-left py-2 font-semibold">Account</th>
                  <th className="text-left py-2 font-semibold">Date</th>
                  <th className="text-left py-2 font-semibold">Status</th>
                  <th className="text-left py-2 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayouts.map((p) => (
                  <tr key={p._id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        {p.docId?.image && (
                          <img src={p.docId.image} alt="" className="w-8 h-8 rounded-full object-cover" />
                        )}
                        <div>
                          <p className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                            {p.docId?.name || 'Unknown'}
                            {p.docId?.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-blue-500" />}
                          </p>
                          <p className="text-[10px] text-gray-400">{p.docId?.speciality}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 font-bold text-gray-800">₦{p.amount.toLocaleString()}</td>
                    <td className="py-3 text-xs text-gray-600">{p.bankName}</td>
                    <td className="py-3">
                      <div className="text-xs text-gray-600">{p.accountNumber}</div>
                      <div className="text-[10px] text-gray-400">{p.accountName}</div>
                    </td>
                    <td className="py-3 text-xs text-gray-500">
                      {new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3">
                      <span className={statusBadge(p.status)}>
                        <span className="flex items-center gap-1">{statusIcon(p.status)} {p.status}</span>
                      </span>
                    </td>
                    <td className="py-3">
                      {p.status === 'pending' ? (
                        <button
                          onClick={() => { setReviewModal(p); setRejectionReason(''); }}
                          className="px-3 py-1 bg-primary text-white text-[11px] font-semibold rounded-lg hover:bg-primary-dark cursor-pointer"
                        >
                          Review
                        </button>
                      ) : (
                        <span className="text-[10px] text-gray-400">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setReviewModal(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-gray-800 mb-1">Review Payout</h3>
            <p className="text-xs text-gray-500 mb-5">Process this withdrawal request.</p>

            <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Doctor</span>
                <span className="font-semibold text-gray-800">{reviewModal.docId?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Amount</span>
                <span className="font-bold text-gray-800">₦{reviewModal.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Bank</span>
                <span className="text-gray-700">{reviewModal.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Account</span>
                <span className="text-gray-700">{reviewModal.accountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Account Name</span>
                <span className="text-gray-700">{reviewModal.accountName}</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">Rejection Reason (if rejecting)</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={2}
                placeholder="Optional unless rejecting..."
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleReview('approved')}
                disabled={processing}
                className="flex-1 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 cursor-pointer disabled:opacity-60"
              >
                {processing ? 'Processing...' : 'Approve & Pay'}
              </button>
              <button
                onClick={() => handleReview('rejected')}
                disabled={processing}
                className="flex-1 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 cursor-pointer disabled:opacity-60"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayouts;

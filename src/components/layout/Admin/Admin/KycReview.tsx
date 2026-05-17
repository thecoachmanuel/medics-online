"use client";

import { useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { ShieldCheck, AlertCircle, FileText, Check, X, Search, Loader, ExternalLink } from 'lucide-react';

import { AdminContext } from '@/context/AdminContext';
import type { IAdminContext } from '@/models/doctor';
import { smartApi } from '@/utils/smartApi';

const KycReview = () => {
  const { doctors, aToken, getAllDoctors } = useContext(AdminContext) as IAdminContext;

  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [rejectingDocId, setRejectingDocId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (aToken) {
      getAllDoctors();
    }
  }, [aToken]);

  // Handle Approve Action
  const handleApprove = async (docId: string) => {
    try {
      setIsActionLoading(docId + '-approve');
      console.log('👑 Admin KYC: Approving KYC for doctor:', docId);

      const response = await smartApi.post('/api/admin/review-kyc', {
        docId,
        action: 'approve'
      }, {
        headers: { aToken }
      }) as { success: boolean; message: string };

      if (response.success) {
        toast.success(response.message || 'KYC approved & verified badge granted!');
        getAllDoctors();
        console.log('✅ Doctor KYC approved via Smart API');
      } else {
        toast.error(response.message || 'Approval action failed');
      }
    } catch (error) {
      console.error('❌ KYC approval error:', error);
      toast.error('An error occurred during approval');
    } finally {
      setIsActionLoading(null);
    }
  };

  // Handle Reject Action
  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingDocId || !rejectionReason.trim()) {
      toast.warning('Please enter a reason for rejection');
      return;
    }

    try {
      setIsActionLoading(rejectingDocId + '-reject');
      console.log('👑 Admin KYC: Rejecting KYC for doctor:', rejectingDocId);

      const response = await smartApi.post('/api/admin/review-kyc', {
        docId: rejectingDocId,
        action: 'reject',
        reason: rejectionReason
      }, {
        headers: { aToken }
      }) as { success: boolean; message: string };

      if (response.success) {
        toast.success(response.message || 'KYC rejected successfully');
        setRejectingDocId(null);
        setRejectionReason('');
        getAllDoctors();
        console.log('✅ Doctor KYC rejected via Smart API');
      } else {
        toast.error(response.message || 'Rejection action failed');
      }
    } catch (error) {
      console.error('❌ KYC rejection error:', error);
      toast.error('An error occurred during rejection');
    } finally {
      setIsActionLoading(null);
    }
  };

  // Filter and Search Doctors
  const filteredDoctors = (doctors || []).filter((doc: any) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          doc.speciality.toLowerCase().includes(searchTerm.toLowerCase());
    
    const docKycStatus = doc.kycStatus || 'not_submitted';

    if (activeTab === 'pending') {
      return matchesSearch && docKycStatus === 'pending';
    }
    if (activeTab === 'approved') {
      return matchesSearch && docKycStatus === 'approved';
    }
    if (activeTab === 'rejected') {
      return matchesSearch && docKycStatus === 'rejected';
    }
    return matchesSearch; // 'all'
  });

  // Calculate status counts
  const pendingCount = (doctors || []).filter((doc: any) => (doc.kycStatus || 'not_submitted') === 'pending').length;
  const approvedCount = (doctors || []).filter((doc: any) => (doc.kycStatus || 'not_submitted') === 'approved').length;
  const rejectedCount = (doctors || []).filter((doc: any) => (doc.kycStatus || 'not_submitted') === 'rejected').length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            KYC Approvals & Verification Portal
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Review professional credentials, approve practice licenses, grant verification badges, or provide correction feedback.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Search by doctor name or speciality..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex border-b mb-6 text-sm">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 px-4 font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'pending'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Pending Reviews
          <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
            activeTab === 'pending' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
          }`}>
            {pendingCount}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          className={`pb-3 px-4 font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'approved'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Approved Verifications
          <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
            activeTab === 'approved' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'
          }`}>
            {approvedCount}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('rejected')}
          className={`pb-3 px-4 font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'rejected'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Rejected
          <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
            activeTab === 'rejected' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'
          }`}>
            {rejectedCount}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3 px-4 font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          All Profiles
        </button>
      </div>

      {/* Grid List */}
      {filteredDoctors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doc: any) => {
            const status = doc.kycStatus || 'not_submitted';
            return (
              <div 
                key={doc._id}
                className="bg-white border rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between"
              >
                {/* Doctor Bio */}
                <div className="p-5">
                  <div className="flex items-center gap-4">
                    <img 
                      src={doc.image || '/assets/profile_pic.png'} 
                      alt={doc.name} 
                      className="w-14 h-14 rounded-full object-cover border bg-gray-50"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-gray-900 flex items-center gap-1">
                        {doc.name}
                        {doc.isVerified && (
                          <img className="w-4 h-4" src="/assets/verified_icon.svg" alt="Verified Badge" />
                        )}
                      </h3>
                      <p className="text-xs text-gray-500 truncate">{doc.speciality}</p>
                      <p className="text-[10px] text-gray-400 truncate">{doc.email}</p>
                    </div>
                  </div>

                  {/* Status Indicator Pill */}
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-gray-500">KYC Status:</span>
                    {status === 'pending' && (
                      <span className="bg-blue-50 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold border border-blue-100">
                        Pending Approval
                      </span>
                    )}
                    {status === 'approved' && (
                      <span className="bg-green-50 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold border border-green-100">
                        Verified & Active
                      </span>
                    )}
                    {status === 'rejected' && (
                      <span className="bg-red-50 text-red-700 text-[10px] px-2 py-0.5 rounded-full font-bold border border-red-100">
                        Rejected
                      </span>
                    )}
                    {status === 'not_submitted' && (
                      <span className="bg-gray-50 text-gray-600 text-[10px] px-2 py-0.5 rounded-full font-bold border border-gray-100">
                        Not Submitted
                      </span>
                    )}
                  </div>

                  {/* Documents View links */}
                  {status !== 'not_submitted' && (
                    <div className="mt-4 pt-4 border-t space-y-2">
                      <p className="text-[10px] font-bold text-gray-500 mb-1">Documents Uploaded:</p>
                      
                      {doc.kycIdDocument ? (
                        <a 
                          href={doc.kycIdDocument}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between text-xs text-primary hover:underline bg-gray-50 p-2 rounded-lg border"
                        >
                          <span className="flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5" />
                            Identity Document (ID Card)
                          </span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <p className="text-[10px] text-red-500 italic">No Identity Document found</p>
                      )}

                      {doc.kycLicenseDocument ? (
                        <a 
                          href={doc.kycLicenseDocument}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between text-xs text-primary hover:underline bg-gray-50 p-2 rounded-lg border"
                        >
                          <span className="flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5" />
                            Medical License / Credentials
                          </span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <p className="text-[10px] text-red-500 italic">No practicing license found</p>
                      )}
                    </div>
                  )}

                  {/* Rejection comment */}
                  {status === 'rejected' && doc.kycRejectionReason && (
                    <div className="mt-3 bg-red-50 border border-red-100 p-2.5 rounded-lg text-[10px] text-red-700">
                      <span className="font-bold">Rejection Reason:</span> {doc.kycRejectionReason}
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="bg-gray-50 px-5 py-3 border-t flex justify-end gap-2">
                  {status === 'pending' ? (
                    <>
                      <button
                        onClick={() => setRejectingDocId(doc._id)}
                        disabled={isActionLoading !== null}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-700 rounded-lg text-xs font-semibold bg-white hover:bg-red-50 transition-all cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        Reject
                      </button>
                      <button
                        onClick={() => handleApprove(doc._id)}
                        disabled={isActionLoading !== null}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary-dark shadow transition-all cursor-pointer"
                      >
                        {isActionLoading === doc._id + '-approve' ? (
                          <Loader className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        Approve
                      </button>
                    </>
                  ) : (
                    <p className="text-[10px] text-gray-400 italic">No actions available</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-dashed rounded-2xl text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
            <ShieldCheck className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="font-bold text-gray-700 text-sm">No verification requests found</h3>
          <p className="text-xs text-gray-400 max-w-xs mt-1">
            There are currently no doctor profiles matching the tab selection or search criteria.
          </p>
        </div>
      )}

      {/* Custom Rejection Dialog Modal */}
      {rejectingDocId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form 
            onSubmit={handleRejectSubmit} 
            className="bg-white rounded-2xl p-6 shadow-xl max-w-md w-full"
          >
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-1.5 mb-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Reject KYC Submission
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Please specify the precise reason for rejecting this doctor's credentials. The doctor will see this feedback in their profile portal and can re-upload their documents accordingly.
            </p>

            <textarea
              required
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Identity document uploaded is blurry, or Medical practicing license scan is expired."
              className="w-full p-3 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary mb-5"
            />

            <div className="flex justify-end gap-2 border-t pt-4">
              <button
                type="button"
                onClick={() => {
                  setRejectingDocId(null);
                  setRejectionReason('');
                }}
                className="px-4 py-2 border rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isActionLoading !== null || !rejectionReason.trim()}
                className={`px-5 py-2 rounded-lg text-xs font-semibold text-white cursor-pointer ${
                  isActionLoading !== null || !rejectionReason.trim()
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {isActionLoading === rejectingDocId + '-reject' ? (
                  <Loader className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  'Submit Rejection'
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default KycReview;

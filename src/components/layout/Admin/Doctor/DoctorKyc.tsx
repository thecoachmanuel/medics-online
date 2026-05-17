"use client";

import { useContext, useEffect, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import { ShieldCheck, AlertCircle, FileText, UploadCloud, CheckCircle, Loader } from 'lucide-react';

import { DoctorContext } from '@/context/DoctorContext';
import type { IDoctorContext } from '@/models/doctor';
import { smartApi } from '@/utils/smartApi';

const DoctorKyc = () => {
  const { dToken, profileData, getProfileData } = useContext(DoctorContext) as IDoctorContext;

  const [idFile, setIdFile] = useState<File | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const idInputRef = useRef<HTMLInputElement>(null);
  const licenseInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (dToken) {
      getProfileData();
    }
  }, [dToken]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'id' | 'license') => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      
      if (!validTypes.includes(file.type)) {
        toast.error('Only JPG, PNG, or PDF files are accepted');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size cannot exceed 5MB');
        return;
      }

      if (type === 'id') {
        setIdFile(file);
      } else {
        setLicenseFile(file);
      }
    }
  };

  const onSubmitKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idFile || !licenseFile) {
      toast.warning('Please select both ID and License documents');
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('🩺 Doctor KYC: Packaging files in FormData for auto base64 & encryption');
      
      const formData = new FormData();
      formData.append('kycIdDocument', idFile);
      formData.append('kycLicenseDocument', licenseFile);

      const data = await smartApi.post('/api/doctor/submit-kyc', formData, {
        headers: { dToken }
      }) as { success: boolean; message: string };

      if (data.success) {
        toast.success(data.message || 'KYC documents submitted successfully!');
        setIdFile(null);
        setLicenseFile(null);
        getProfileData();
        console.log('✅ Doctor KYC submitted via Smart API');
      } else {
        toast.error(data.message || 'KYC submission failed');
      }
    } catch (error) {
      console.error('❌ KYC submission error:', error);
      toast.error('An error occurred during submission. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!profileData) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const kycStatus = profileData.kycStatus || 'not_submitted';

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-primary" />
          KYC & Professional Verification
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Submit official verification details to build client trust and achieve a verified provider status badge.
        </p>
      </div>

      {/* Render Status Alert Banners */}
      {kycStatus === 'pending' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8 flex items-start gap-4">
          <div className="p-3 bg-blue-100 rounded-lg text-blue-700">
            <Loader className="w-6 h-6 animate-spin" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 text-lg">KYC Verification Under Active Review</h3>
            <p className="text-sm text-blue-700 mt-1">
              Your identity credentials and medical license have been successfully uploaded. Our verification officers are checking your documents. This process generally completes in 24-48 business hours.
            </p>
          </div>
        </div>
      )}

      {kycStatus === 'approved' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8 flex items-start gap-4 shadow-sm animate-fade-in">
          <div className="p-3 bg-green-100 rounded-lg text-green-700">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-green-900 text-lg flex items-center gap-2">
              Verification Approved!
            </h3>
            <p className="text-sm text-green-700 mt-1">
              Congratulations! Your professional medical status has been verified. A verified checkmark badge has been added to your profile card and search listings to highlight your credentials to potential clients.
            </p>
          </div>
        </div>
      )}

      {kycStatus === 'rejected' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8 flex items-start gap-4">
          <div className="p-3 bg-red-100 rounded-lg text-red-700">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 text-lg">Verification Application Rejected</h3>
            <p className="text-sm text-red-700 mt-1 font-medium bg-red-100/50 p-3 rounded-lg border border-red-200">
              Reason: {profileData.kycRejectionReason || 'Documents uploaded were unreadable or expired.'}
            </p>
            <p className="text-xs text-red-600 mt-2">
              Please review the feedback reason above and submit clear, readable documents below to re-verify.
            </p>
          </div>
        </div>
      )}

      {/* Upload Section (Visible if not_submitted or rejected) */}
      {(kycStatus === 'not_submitted' || kycStatus === 'rejected') && (
        <form onSubmit={onSubmitKyc} className="bg-white border rounded-2xl shadow-sm p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Upload Verification Documents</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* ID Document Selector */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-2">
                1. Official Means of Identification
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Upload a valid government-issued ID card, Passport, or Driver's license (JPG or PDF).
              </p>
              
              <div 
                onClick={() => idInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
                  idFile ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary hover:bg-gray-50'
                }`}
              >
                <input 
                  type="file" 
                  ref={idInputRef}
                  onChange={(e) => handleFileChange(e, 'id')}
                  className="hidden" 
                  accept=".jpg,.jpeg,.png,.pdf"
                />
                
                {idFile ? (
                  <div className="text-center">
                    <FileText className="w-10 h-10 text-primary mx-auto mb-2" />
                    <p className="text-xs font-semibold text-gray-700 truncate max-w-[200px]">{idFile.name}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{(idFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <UploadCloud className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-gray-600">Click to upload ID</p>
                    <p className="text-[10px] text-gray-400 mt-1">Accepts JPG, PNG, PDF up to 5MB</p>
                  </div>
                )}
              </div>
            </div>

            {/* License/Credential Selector */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-2">
                2. Medical License or Credentials
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Upload your official practicing license, medical degree, or certification (JPG or PDF).
              </p>
              
              <div 
                onClick={() => licenseInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
                  licenseFile ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary hover:bg-gray-50'
                }`}
              >
                <input 
                  type="file" 
                  ref={licenseInputRef}
                  onChange={(e) => handleFileChange(e, 'license')}
                  className="hidden" 
                  accept=".jpg,.jpeg,.png,.pdf"
                />
                
                {licenseFile ? (
                  <div className="text-center">
                    <FileText className="w-10 h-10 text-primary mx-auto mb-2" />
                    <p className="text-xs font-semibold text-gray-700 truncate max-w-[200px]">{licenseFile.name}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{(licenseFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <UploadCloud className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-gray-600">Click to upload License</p>
                    <p className="text-[10px] text-gray-400 mt-1">Accepts JPG, PNG, PDF up to 5MB</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="border-t pt-6 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !idFile || !licenseFile}
              className={`px-8 py-3 rounded-lg text-sm font-semibold text-white shadow transition-all duration-200 cursor-pointer ${
                isSubmitting || !idFile || !licenseFile
                  ? 'bg-gray-300 cursor-not-allowed shadow-none'
                  : 'bg-primary hover:bg-primary-dark hover:shadow-md'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  Submitting KYC...
                </span>
              ) : (
                'Submit KYC Documents'
              )}
            </button>
          </div>
        </form>
      )}

      {/* Uploaded Documents Preview (Only visible if pending or approved) */}
      {(kycStatus === 'pending' || kycStatus === 'approved') && (
        <div className="bg-white border rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Submitted Credentials</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {profileData.kycIdDocument && (
              <a 
                href={profileData.kycIdDocument}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 border rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-700 truncate">Means of Identification</p>
                  <p className="text-xs text-gray-400 mt-0.5">Click to view/download file</p>
                </div>
              </a>
            )}

            {profileData.kycLicenseDocument && (
              <a 
                href={profileData.kycLicenseDocument}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 border rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-700 truncate">Medical License / Credentials</p>
                  <p className="text-xs text-gray-400 mt-0.5">Click to view/download file</p>
                </div>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorKyc;

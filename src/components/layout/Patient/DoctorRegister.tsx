"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Eye, EyeOff, User, Stethoscope, Clock, ChevronLeft, ChevronRight, FileCheck, HelpCircle } from 'lucide-react';

import { smartApi } from '@/utils/smartApi';

const DoctorRegister = () => {
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: 'Dr.',
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    speciality: '',
    degree: '',
    experience: '',
    about: '',
    fees: '',
    addressLine1: '',
    addressLine2: '',
    workingHoursStart: '10:00',
    workingHoursEnd: '22:00',
    workingHours: [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '18:00' }] as { start: string; end: string }[],
    excludedDays: [] as number[],
    image: null as File | null
  });
  
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const weekdays = [
    { label: 'Sunday', value: 0 },
    { label: 'Monday', value: 1 },
    { label: 'Tuesday', value: 2 },
    { label: 'Wednesday', value: 3 },
    { label: 'Thursday', value: 4 },
    { label: 'Friday', value: 5 },
    { label: 'Saturday', value: 6 }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData(prev => ({
        ...prev,
        image: file
      }));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleExcludedDay = (dayValue: number) => {
    setFormData(prev => {
      const isAlreadyExcluded = prev.excludedDays.includes(dayValue);
      const updated = isAlreadyExcluded
        ? prev.excludedDays.filter(d => d !== dayValue)
        : [...prev.excludedDays, dayValue];
      return {
        ...prev,
        excludedDays: updated
      };
    });
  };

  const addWorkingHourRange = () => {
    setFormData(prev => ({
      ...prev,
      workingHours: [...prev.workingHours, { start: '09:00', end: '17:00' }]
    }));
  };

  const removeWorkingHourRange = (index: number) => {
    if (formData.workingHours.length <= 1) {
      toast.warning('You must configure at least one active working hour range.');
      return;
    }
    setFormData(prev => ({
      ...prev,
      workingHours: prev.workingHours.filter((_, idx) => idx !== index)
    }));
  };

  const updateWorkingHourRange = (index: number, field: 'start' | 'end', value: string) => {
    setFormData(prev => {
      const updated = prev.workingHours.map((range, idx) => {
        if (idx === index) {
          return { ...range, [field]: value };
        }
        return range;
      });
      return { ...prev, workingHours: updated };
    });
  };

  const validateStep = () => {
    if (step === 1) {
      if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.password || !formData.confirmPassword) {
        toast.warning('Please fill in all account credentials including phone number');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        return false;
      }
      if (formData.password.length < 8) {
        toast.error('Password must be at least 8 characters long');
        return false;
      }
      if (!formData.image) {
        toast.warning('Please upload your profile image');
        return false;
      }
    } else if (step === 2) {
      if (!formData.speciality || !formData.degree.trim() || !formData.experience || !formData.fees || !formData.about.trim() || !formData.addressLine1.trim()) {
        toast.warning('Please complete all professional and address details');
        return false;
      }
    } else if (step === 3) {
      for (let i = 0; i < formData.workingHours.length; i++) {
        const range = formData.workingHours[i];
        const startVal = parseInt(range.start.replace(':', ''), 10);
        const endVal = parseInt(range.end.replace(':', ''), 10);
        if (startVal >= endVal) {
          toast.error(`Time Slot Range #${i + 1} (${range.start} - ${range.end}) is invalid. Start time must be before End time.`);
          return false;
        }
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep()) return;
    
    setLoading(true);
    
    try {
      const data = new FormData();
      
      const formatDoctorName = (titleVal: string, nameVal: string) => {
        const t = titleVal.trim();
        const n = nameVal.trim();
        if (!t) return n;
        const prefix = t.endsWith(' ') ? t : `${t} `;
        if (n.startsWith(prefix)) {
          return n;
        }
        return prefix + n;
      };

      data.append('name', formatDoctorName(formData.title, formData.name));
      data.append('email', formData.email);
      data.append('phone', formData.phone);
      data.append('password', formData.password);
      data.append('speciality', formData.speciality);
      data.append('degree', formData.degree);
      data.append('experience', formData.experience);
      data.append('about', formData.about);
      data.append('fees', formData.fees);
      data.append('address', JSON.stringify({
        line1: formData.addressLine1,
        line2: formData.addressLine2
      }));
      data.append('workingHoursStart', formData.workingHours[0]?.start || '10:00');
      data.append('workingHoursEnd', formData.workingHours[0]?.end || '22:00');
      data.append('workingHours', JSON.stringify(formData.workingHours));
      data.append('excludedDays', JSON.stringify(formData.excludedDays));
      
      if (formData.image) {
        data.append('image', formData.image);
      }
      
      console.log('🩺 Doctor Self-Registration: Submitting multi-step form data');
      const response: any = await smartApi.post('/api/doctor/register', data);
      
      if (response.success) {
        toast.success('Registration successful! Awaiting admin approval.');
        router.push('/admin-login?role=doctor');
      } else {
        toast.error(response.message || 'Registration failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-gray-50/50 py-10 flex items-center justify-center px-4">
      <div className="max-w-3xl w-full bg-white rounded-2xl border shadow-sm overflow-hidden">
        
        {/* Visual Progress Stepper Header */}
        <div className="bg-gray-50 border-b p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Doctor Registration</h1>
              <p className="text-xs text-gray-500 mt-1">Join Medics-Online to connect with patients globally.</p>
            </div>
            <div className="bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-bold">
              Step {step} of 3
            </div>
          </div>

          {/* Stepper Indicators */}
          <div className="flex items-center gap-4 mt-6">
            <div className="flex-1 flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors duration-300 ${
                step >= 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {step > 1 ? '✓' : '1'}
              </div>
              <span className={`text-xs font-semibold hidden sm:inline ${step >= 1 ? 'text-gray-800' : 'text-gray-400'}`}>
                Account Info
              </span>
              <div className="flex-1 h-0.5 bg-gray-200 rounded">
                <div className={`h-full bg-primary rounded transition-all duration-300 ${step >= 2 ? 'w-full' : 'w-0'}`} />
              </div>
            </div>

            <div className="flex-1 flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors duration-300 ${
                step >= 2 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {step > 2 ? '✓' : '2'}
              </div>
              <span className={`text-xs font-semibold hidden sm:inline ${step >= 2 ? 'text-gray-800' : 'text-gray-400'}`}>
                Professional details
              </span>
              <div className="flex-1 h-0.5 bg-gray-200 rounded">
                <div className={`h-full bg-primary rounded transition-all duration-300 ${step >= 3 ? 'w-full' : 'w-0'}`} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors duration-300 ${
                step === 3 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                3
              </div>
              <span className={`text-xs font-semibold hidden sm:inline ${step === 3 ? 'text-gray-800' : 'text-gray-400'}`}>
                Working Hours
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            
            {/* STEP 1: ACCOUNT CREDENTIALS */}
            {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-base font-bold text-gray-800 flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-primary" />
                  Account Basics & Credentials
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Prefix / Title</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="e.g. Dr., Prof."
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="name@hospital.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Mobile / Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="e.g. +234 801 234 5678"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="At least 8 chars"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Repeat password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Profile Image Drag Area */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">Doctor Profile Photo</label>
                  <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border rounded-xl bg-gray-50/50">
                    <div className="w-20 h-20 rounded-full bg-gray-100 border flex items-center justify-center overflow-hidden shrink-0">
                      {previewImage ? (
                        <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="block w-full text-xs text-gray-500
                          file:mr-4 file:py-1.5 file:px-3.5
                          file:rounded-lg file:border-0
                          file:text-xs file:font-semibold
                          file:bg-primary file:text-white
                          hover:file:bg-primary-dark cursor-pointer"
                        required
                      />
                      <p className="mt-1.5 text-[10px] text-gray-400">Upload a professional headshot photo. Supports JPG, PNG.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: PROFESSIONAL INFORMATION */}
            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-base font-bold text-gray-800 flex items-center gap-2 mb-4">
                  <Stethoscope className="w-5 h-5 text-primary" />
                  Professional Qualifications
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Speciality Field</label>
                    <select
                      name="speciality"
                      value={formData.speciality}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    >
                      <option value="">Select Speciality</option>
                      <option value="General physician">General physician</option>
                      <option value="Gynecologist">Gynecologist</option>
                      <option value="Dermatologist">Dermatologist</option>
                      <option value="Pediatricians">Pediatricians</option>
                      <option value="Neurologist">Neurologist</option>
                      <option value="Gastroenterologist">Gastroenterologist</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Degrees & Credentials</label>
                    <input
                      type="text"
                      name="degree"
                      value={formData.degree}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="e.g. MBBS, MD, FRCS"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Years of Experience</label>
                    <select
                      name="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    >
                      <option value="">Select Experience</option>
                      {Array.from({ length: 40 }, (_, i) => `${i + 1} Year${i > 0 ? 's' : ''}`).map(exp => (
                        <option key={exp} value={exp}>{exp}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Consultation Fees (₦)</label>
                    <input
                      type="number"
                      name="fees"
                      value={formData.fees}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="e.g. 5000"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Address Details (Practice Location)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="addressLine1"
                      value={formData.addressLine1}
                      onChange={handleInputChange}
                      placeholder="Street address, Clinic name"
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                    <input
                      type="text"
                      name="addressLine2"
                      value={formData.addressLine2}
                      onChange={handleInputChange}
                      placeholder="Suite, Landmark (Optional)"
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Professional Bio (About)</label>
                  <textarea
                    name="about"
                    value={formData.about}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Describe your credentials, treatment philosophies, and background..."
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>
              </div>
            )}

            {/* STEP 3: AVAILABILITY & WORKING HOURS */}
            {step === 3 && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-base font-bold text-gray-800 flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-primary" />
                  Custom Time Availability & Days Off
                </h2>
                
                <p className="text-xs text-gray-500 bg-blue-50 border border-blue-100 p-3 rounded-lg">
                  Define your exact calendar scheduling setup. Patients will only see and book appointments on the hours and days you specify here. You can adjust this configuration anytime from your profile workspace.
                </p>

                {/* Day Exclusions */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Select Excluded Days (Days you will NOT be working)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {weekdays.map(day => {
                      const isExcluded = formData.excludedDays.includes(day.value);
                      return (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleExcludedDay(day.value)}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                            isExcluded
                              ? 'bg-red-50 text-red-700 border-red-200 shadow-sm'
                              : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
                          }`}
                        >
                          {day.label} {isExcluded ? ' (Off)' : ''}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Hour Ranges */}
                <div className="pt-2 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-gray-700">
                      Configure Multiple Daily Working Hour Slots
                    </label>
                    <button
                      type="button"
                      onClick={addWorkingHourRange}
                      className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1"
                    >
                      + Add Time Slot
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formData.workingHours.map((range, index) => (
                      <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-gray-50 border border-gray-100 p-4 rounded-2xl relative">
                        <div className="w-full sm:w-1/2">
                          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                            Slot #{index + 1} Start
                          </label>
                          <select
                            value={range.start}
                            onChange={(e) => updateWorkingHourRange(index, 'start', e.target.value)}
                            className="w-full px-3 py-2 border rounded-xl text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            {Array.from({ length: 24 }, (_, i) => {
                              const hr = i.toString().padStart(2, '0') + ':00';
                              return <option key={hr} value={hr}>{hr}</option>;
                            })}
                          </select>
                        </div>
                        <div className="w-full sm:w-1/2">
                          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                            Slot #{index + 1} End
                          </label>
                          <select
                            value={range.end}
                            onChange={(e) => updateWorkingHourRange(index, 'end', e.target.value)}
                            className="w-full px-3 py-2 border rounded-xl text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            {Array.from({ length: 24 }, (_, i) => {
                              const hr = i.toString().padStart(2, '0') + ':00';
                              return <option key={hr} value={hr}>{hr}</option>;
                            })}
                          </select>
                        </div>
                        {formData.workingHours.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeWorkingHourRange(index)}
                            className="absolute sm:static top-2 right-2 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-xl transition-all duration-200 cursor-pointer self-end sm:self-center sm:mt-4"
                            title="Remove Slot"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Stepper Navigation Footer Buttons */}
            <div className="border-t pt-6 flex items-center justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
              ) : (
                <div />
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-1.5 px-5 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-dark shadow hover:shadow-md transition-all cursor-pointer"
                >
                  Next Step
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary-dark shadow hover:shadow-md transition-all cursor-pointer"
                >
                  {loading ? (
                    'Registering...'
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4" />
                      Complete Registration
                    </>
                  )}
                </button>
              )}
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default DoctorRegister;

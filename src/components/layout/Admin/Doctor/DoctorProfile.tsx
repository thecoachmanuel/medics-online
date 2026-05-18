"use client";

import { useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import { DoctorContext } from '@/context/DoctorContext';
import { AppContext } from '@/context/AppContext';
import type { IDoctorContext } from '@/models/doctor';
import type { IPatientAppContext } from '@/models/patient';
import { smartApi } from '@/utils/smartApi';

const DoctorProfile = () => {
  const { dToken, profileData, setProfileData, getProfileData } = useContext(
    DoctorContext
  ) as IDoctorContext;
  const { currencySymbol } = useContext(AppContext) as IPatientAppContext;
  const [isEdit, setIsEdit] = useState(false);
  const [newImage, setNewImage] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewImage(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Function to toggle availability immediately
  const toggleAvailability = async () => {
    if (!profileData) {
      toast.error('Profile data not loaded.');
      return;
    }

    try {
      console.log('🔥 AVAILABILITY CHECKBOX CLICKED! Current state:', profileData.available);
      
      // Toggle the availability in local state immediately
      const newAvailability = !profileData.available;
      setProfileData((prev) =>
        prev
          ? {
              ...prev,
              available: newAvailability
            }
          : null
      );

      // Send update to server
      const updateData = {
        address: profileData.address,
        fees: profileData.fees,
        about: profileData.about,
        available: newAvailability
      };

      console.log('🩺 Doctor Portal: Updating availability with encryption');
      const data = await smartApi.post('/api/doctor/update-profile', updateData, {
        headers: { dToken }
      }) as { success: boolean; message?: string };

      if (data.success) {
        toast.success(`Availability ${newAvailability ? 'enabled' : 'disabled'}`);
        console.log('✅ Doctor availability updated via Smart API');
      } else {
        toast.error(data.message || 'Availability update failed');
        // Revert local state on failure
        setProfileData((prev) =>
          prev
            ? {
                ...prev,
                available: !newAvailability
              }
            : null
        );
      }
    } catch (error: unknown) {
      console.error('❌ Doctor availability update error:', error);
      // Revert local state on error
      setProfileData((prev) =>
        prev
          ? {
              ...prev,
              available: !profileData.available
            }
          : null
      );
      toast.error('An error occurred while updating availability');
    }
  };

  const addWorkingHourRange = () => {
    setProfileData(prev => {
      if (!prev) return null;
      const currentHours = prev.workingHours || [];
      return {
        ...prev,
        workingHours: [...currentHours, { start: '09:00', end: '17:00' }]
      };
    });
  };

  const removeWorkingHourRange = (index: number) => {
    setProfileData(prev => {
      if (!prev) return null;
      const currentHours = prev.workingHours || [];
      if (currentHours.length <= 1) {
        toast.warning('You must configure at least one active working hour range.');
        return prev;
      }
      return {
        ...prev,
        workingHours: currentHours.filter((_, idx) => idx !== index)
      };
    });
  };

  const updateWorkingHourRange = (index: number, field: 'start' | 'end', value: string) => {
    setProfileData(prev => {
      if (!prev) return null;
      const currentHours = prev.workingHours || [];
      const updated = currentHours.map((range, idx) => {
        if (idx === index) {
          return { ...range, [field]: value };
        }
        return range;
      });
      return {
        ...prev,
        workingHours: updated
      };
    });
  };

  const updateProfile = async () => {
    if (!profileData) {
      toast.error('Profile data not loaded.');
      return;
    }

    // Validate workingHours
    if (profileData.workingHours) {
      for (let i = 0; i < profileData.workingHours.length; i++) {
        const range = profileData.workingHours[i];
        const startVal = parseInt(range.start.replace(':', ''), 10);
        const endVal = parseInt(range.end.replace(':', ''), 10);
        if (startVal >= endVal) {
          toast.error(`Time Slot Range #${i + 1} (${range.start} - ${range.end}) is invalid. Start time must be before End time.`);
          return;
        }
      }
    }

    try {
      let imageData = null;
      if (newImage) {
        // Read file as base64
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(newImage);
        });
        imageData = {
          data: base64Data,
          mimeType: newImage.type
        };
      }

      const updateData: any = {
        address: profileData.address,
        fees: profileData.fees,
        about: profileData.about,
        available: profileData.available,
        phone: profileData.phone || '',
        workingHoursStart: profileData.workingHours && profileData.workingHours[0]?.start || '10:00',
        workingHoursEnd: profileData.workingHours && profileData.workingHours[0]?.end || '22:00',
        workingHours: profileData.workingHours || [],
        excludedDays: profileData.excludedDays || []
      };

      if (imageData) {
        updateData.image = imageData;
      }

      console.log('🩺 Doctor Portal: Attempting encrypted profile update');
      const data = await smartApi.post('/api/doctor/update-profile', updateData, {
        headers: { dToken }
      }) as { success: boolean; message?: string };

      if (data.success) {
        toast.success(data.message || 'Profile updated successfully');
        setIsEdit(false);
        setNewImage(null);
        setNewImagePreview(null);
        getProfileData();
        console.log('✅ Doctor profile updated via Smart API');
      } else {
        toast.error(data.message || 'Profile update failed');
      }

      setIsEdit(false);
    } catch (error: unknown) {
      console.error('❌ Doctor profile update error:', error);
      if (
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof (error as { message?: unknown }).message === 'string'
      ) {
        toast.error((error as { message: string }).message);
      } else {
        toast.error('An error occurred while updating profile');
      }
    }
  };

  useEffect(() => {
    if (dToken) {
      getProfileData();
    }
  }, [dToken]);

  return (
    profileData && (
      <div>
        <div className="flex flex-col gap-4 m-5">
          <div className="relative group w-full sm:max-w-64">
            <img
              className="doctor-profile-image w-full sm:max-w-64 rounded-lg object-cover"
              src={newImagePreview || profileData.image}
              alt={`Dr. ${profileData.name}`}
            />
            {isEdit && (
              <label className="absolute inset-0 bg-black/50 hover:bg-black/70 flex flex-col items-center justify-center text-white cursor-pointer rounded-lg transition-all gap-1 text-xs font-semibold">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Change Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="flex-1 border border-stone-100 rounded-lg p-8 py-7 bg-white">
            {/* ----- Doc Info : name, degree, experience ----- */}

            <p className="flex items-center gap-2 text-3xl font-medium text-gray-700">
              {profileData.name}
            </p>
            <div className="flex items-center gap-2 mt-1 text-gray-600">
              <p>
                {profileData.degree} - {profileData.speciality}
              </p>
              <button className="py-0.5 px-2 border text-xs rounded-full">
                {profileData.experience}
              </button>
            </div>

            {/* ----- Doc About ----- */}
            <div>
              <p className="flex items-center gap-1 text-sm font-medium text-[#262626] mt-3">
                About :
              </p>
              <p className="text-sm text-gray-600 max-w-[700px] mt-1">
                {isEdit ? (
                  <textarea
                    onChange={(e) =>
                      setProfileData((prev) =>
                        prev
                          ? {
                              ...prev,
                              about: e.target.value
                            }
                          : null
                      )
                    }
                    className="w-full outline-primary p-2"
                    rows={8}
                    value={profileData.about}
                  />
                ) : (
                  profileData.about
                )}
              </p>
            </div>

            <p className="text-gray-600 font-medium mt-4">
              Appointment fee:{' '}
              <span className="text-gray-800">
                {currencySymbol}{' '}
                {isEdit ? (
                  <input
                    type="number"
                    onChange={(e) =>
                      setProfileData((prev) =>
                        prev
                          ? {
                              ...prev,
                              fees: parseFloat(e.target.value)
                            }
                          : null
                      )
                    }
                    value={profileData.fees}
                  />
                ) : (
                  profileData.fees
                )}
              </span>
            </p>

            <p className="text-gray-600 font-medium mt-4">
              Mobile / Phone:{' '}
              <span className="text-gray-800">
                {isEdit ? (
                  <input
                    type="tel"
                    onChange={(e) =>
                      setProfileData((prev) =>
                        prev
                          ? {
                              ...prev,
                              phone: e.target.value
                            }
                          : null
                      )
                    }
                    className="border rounded px-2 py-0.5 text-sm outline-primary"
                    value={profileData.phone || ''}
                  />
                ) : (
                  profileData.phone || 'Not set'
                )}
              </span>
            </p>

            <div className="flex gap-2 py-2">
              <p>Address:</p>
              <p className="text-sm">
                {isEdit ? (
                  <input
                    type="text"
                    onChange={(e) =>
                      setProfileData((prev) =>
                        prev
                          ? {
                              ...prev,
                              address: { ...prev.address, line1: e.target.value }
                            }
                          : null
                      )
                    }
                    value={profileData.address.line1}
                  />
                ) : (
                  profileData.address.line1
                )}
                <br />
                {isEdit ? (
                  <input
                    type="text"
                    onChange={(e) =>
                      setProfileData((prev) =>
                        prev
                          ? {
                              ...prev,
                              address: { ...prev.address, line2: e.target.value }
                            }
                          : null
                      )
                    }
                    value={profileData.address.line2}
                  />
                ) : (
                  profileData.address.line2
                )}
              </p>
            </div>

            <div className="flex gap-1 pt-2">
              <input
                type="checkbox"
                onChange={toggleAvailability}
                checked={profileData.available}
                className="cursor-pointer"
              />
              <label htmlFor="" className="cursor-pointer">Available</label>
            </div>

              {/* ----- Custom Time Availability & Day Exclusions ----- */}
              <div className="mt-6 pt-6 border-t">
                <p className="text-gray-700 font-bold text-sm mb-3">Time Availability & Calendar Exclusions</p>
                
                {isEdit ? (
                  <div className="space-y-6">
                    {/* Multiple Daily Working Hours */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-semibold text-gray-600">
                          Configure Multiple Daily Working Hour Slots
                        </label>
                        <button
                          type="button"
                          onClick={addWorkingHourRange}
                          className="px-2.5 py-1 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          + Add Slot
                        </button>
                      </div>

                      <div className="space-y-3">
                        {(profileData.workingHours && profileData.workingHours.length > 0
                          ? profileData.workingHours
                          : [{ start: profileData.workingHoursStart || '10:00', end: profileData.workingHoursEnd || '22:00' }]
                        ).map((range, index) => (
                          <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-gray-50/50 border border-gray-100 p-3 rounded-xl relative">
                            <div className="w-full sm:w-1/2">
                              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                                Slot #{index + 1} Start
                              </label>
                              <select
                                value={range.start}
                                onChange={(e) => updateWorkingHourRange(index, 'start', e.target.value)}
                                className="w-full border rounded p-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                              >
                                {Array.from({ length: 24 }, (_, i) => {
                                  const hr = i.toString().padStart(2, '0') + ':00';
                                  return <option key={hr} value={hr}>{hr}</option>;
                                })}
                              </select>
                            </div>
                            <div className="w-full sm:w-1/2">
                              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                                Slot #{index + 1} End
                              </label>
                              <select
                                value={range.end}
                                onChange={(e) => updateWorkingHourRange(index, 'end', e.target.value)}
                                className="w-full border rounded p-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                              >
                                {Array.from({ length: 24 }, (_, i) => {
                                  const hr = i.toString().padStart(2, '0') + ':00';
                                  return <option key={hr} value={hr}>{hr}</option>;
                                })}
                              </select>
                            </div>
                            {(profileData.workingHours && profileData.workingHours.length > 1) && (
                              <button
                                type="button"
                                onClick={() => removeWorkingHourRange(index)}
                                className="absolute sm:static top-2 right-2 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-1.5 rounded-lg transition-colors cursor-pointer self-end sm:self-center sm:mt-3 text-xs"
                                title="Remove Slot"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Day Exclusions Edit */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2">Excluded Days Off</label>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { label: 'Sunday', value: 0 },
                          { label: 'Monday', value: 1 },
                          { label: 'Tuesday', value: 2 },
                          { label: 'Wednesday', value: 3 },
                          { label: 'Thursday', value: 4 },
                          { label: 'Friday', value: 5 },
                          { label: 'Saturday', value: 6 }
                        ].map((day) => {
                          const isExcluded = (profileData.excludedDays || []).includes(day.value);
                          return (
                            <button
                              key={day.value}
                              type="button"
                              onClick={() =>
                                setProfileData((prev) => {
                                  if (!prev) return null;
                                  const currentExclusions = prev.excludedDays || [];
                                  const updated = currentExclusions.includes(day.value)
                                    ? currentExclusions.filter((d) => d !== day.value)
                                    : [...currentExclusions, day.value];
                                  return {
                                    ...prev,
                                    excludedDays: updated
                                  };
                                })
                              }
                              className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                                isExcluded
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
                              }`}
                            >
                              {day.label} {isExcluded ? ' (Off)' : ''}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm text-gray-600">
                    <div>
                      <span className="font-semibold block mb-1">Working Hour Slots:</span>
                      {profileData.workingHours && profileData.workingHours.length > 0 ? (
                        <div className="space-y-1.5 pl-3 border-l-2 border-primary/20">
                          {profileData.workingHours.map((range, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-xs bg-gray-50 text-gray-700 w-fit px-2.5 py-1 rounded-lg border border-gray-100 font-medium">
                              <span>Slot #{idx + 1}:</span>
                              <span>{range.start} - {range.end}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs bg-gray-50 text-gray-700 w-fit px-2.5 py-1 rounded-lg border border-gray-100 font-medium">
                          {profileData.workingHoursStart || '10:00'} - {profileData.workingHoursEnd || '22:00'}
                        </div>
                      )}
                    </div>
                    <p className="pt-1">
                      <span className="font-semibold">Excluded Days Off:</span>{' '}
                      {profileData.excludedDays && profileData.excludedDays.length > 0 ? (
                        <span className="text-red-600 font-medium">
                          {profileData.excludedDays
                            .map((d) => {
                              const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                              return weekdayNames[d];
                            })
                            .filter(Boolean)
                            .join(', ')}
                        </span>
                      ) : (
                        <span className="text-green-600 font-medium">Working all week (No exclusions)</span>
                      )}
                    </p>
                  </div>
                )}
              </div>

            {isEdit ? (
              <div className="flex gap-3">
                <button
                  onClick={updateProfile}
                  className="px-6 py-2 bg-primary text-white text-sm font-semibold rounded-full mt-5 hover:bg-primary/95 transition-all cursor-pointer shadow hover:shadow-md"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setIsEdit(false);
                    setNewImage(null);
                    setNewImagePreview(null);
                    getProfileData();
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-full mt-5 hover:bg-gray-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEdit(true)}
                className="px-6 py-2 border border-primary text-primary text-sm font-semibold rounded-full mt-5 hover:bg-primary hover:text-white transition-all cursor-pointer"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>
    )
  );
};

export default DoctorProfile;

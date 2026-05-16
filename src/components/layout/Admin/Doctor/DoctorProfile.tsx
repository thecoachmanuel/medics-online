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

  const updateProfile = async () => {
    if (!profileData) {
      toast.error('Profile data not loaded.');
      return;
    }

    try {
      const updateData = {
        address: profileData.address,
        fees: profileData.fees,
        about: profileData.about,
        available: profileData.available
      };

      console.log('🩺 Doctor Portal: Attempting encrypted profile update');
      const data = await smartApi.post('/api/doctor/update-profile', updateData, {
        headers: { dToken }
      }) as { success: boolean; message?: string };

      if (data.success) {
        toast.success(data.message || 'Profile updated successfully');
        setIsEdit(false);
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
          <div>
            <img
              className="doctor-profile-image w-full sm:max-w-64 rounded-lg"
              src={profileData.image}
              alt={`Dr. ${profileData.name}`}
            />
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

            {isEdit ? (
              <button
                onClick={updateProfile}
                className="px-4 py-1 border border-primary text-sm rounded-full mt-5 hover:bg-primary hover:text-white transition-all cursor-pointer"
              >
                Save
              </button>
            ) : (
              <button
                onClick={() => setIsEdit((prev) => !prev)}
                className="px-4 py-1 border border-primary text-sm rounded-full mt-5 hover:bg-primary hover:text-white transition-all cursor-pointer"
              >
                Edit
              </button>
            )}
          </div>
        </div>
      </div>
    )
  );
};

export default DoctorProfile;

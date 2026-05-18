"use client";

import { useContext, useEffect, useState } from 'react';

import { AdminContext } from '@/context/AdminContext';
import type { IAdminContext, IDoctorAdmin, DoctorProfile } from '@/models/doctor';

const DoctorsList = () => {
  const {
    doctors,
    changeAvailability,
    approveDoctor,
    rejectDoctor,
    deleteDoctor,
    editDoctor,
    aToken,
    getAllDoctors,
  } = useContext(AdminContext) as IAdminContext;

  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredDoctors, setFilteredDoctors] = useState<IDoctorAdmin[]>([]);

  // Editing states for inline modal edit
  const [editName, setEditName] = useState<string>('');
  const [editSpeciality, setEditSpeciality] = useState<string>('');
  const [editDegree, setEditDegree] = useState<string>('');
  const [editExperience, setEditExperience] = useState<string>('');
  const [editFees, setEditFees] = useState<string>('');
  const [editAbout, setEditAbout] = useState<string>('');
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);

  console.log('🔍 DoctorsList: Context values:', {
    doctorsCount: doctors?.length,
    hasChangeAvailability: !!changeAvailability,
    hasToken: !!aToken,
  });

  useEffect(() => {
    if (aToken) {
      getAllDoctors();
    }
  }, [aToken]);

  useEffect(() => {
    if (doctors) {
      const filtered = doctors.filter((doctor) =>
        doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.speciality.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDoctors(filtered);
    }
  }, [doctors, searchTerm]);

  const openDoctorModal = (doctor: IDoctorAdmin) => {
    const detailedDoctor = doctor as unknown as DoctorProfile;
    setSelectedDoctor(detailedDoctor);
    setEditImage(null);
    setEditImagePreview(detailedDoctor.image || '');
    setIsModalOpen(true);
  };

  const closeDoctorModal = () => {
    setIsModalOpen(false);
    setSelectedDoctor(null);
    setEditImage(null);
    setEditImagePreview('');
    setIsEditing(false);
  };

  const startEditingDoctor = (doctor: IDoctorAdmin) => {
    const detailedDoctor = doctor as unknown as DoctorProfile;
    setSelectedDoctor(detailedDoctor);
    setEditName(detailedDoctor.name);
    setEditSpeciality(detailedDoctor.speciality);
    setEditDegree(detailedDoctor.degree);
    setEditExperience(detailedDoctor.experience);
    setEditFees(detailedDoctor.fees?.toString() || '');
    setEditAbout(detailedDoctor.about);
    setEditImage(null);
    setEditImagePreview(detailedDoctor.image || '');
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedDoctor) return;
    const formData = new FormData();
    formData.append('docId', selectedDoctor._id);
    formData.append('name', editName);
    formData.append('speciality', editSpeciality);
    formData.append('degree', editDegree);
    formData.append('experience', editExperience);
    formData.append('fees', editFees);
    formData.append('about', editAbout);
    
    if (editImage) {
      formData.append('image', editImage);
    }

    try {
      await editDoctor(formData);
      setIsEditing(false);
      closeDoctorModal();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="m-5 max-h-[90vh] overflow-y-scroll">
      <h1 className="text-lg font-medium">All Doctors</h1>

      {/* Search Bar */}
      <div className="my-4">
        <input
          type="text"
          placeholder="Search doctors by name or speciality..."
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Pending Doctors Section */}
      {filteredDoctors && filteredDoctors.some((doc) => !doc.isApproved) && (
        <div className="mb-6">
          <h2 className="text-md font-semibold text-yellow-700 mb-3">Pending Approval</h2>
          <div className="grid-responsive">
            {filteredDoctors
              .filter((doc) => !doc.isApproved)
              .map((item: IDoctorAdmin, index: number) => (
                <div
                  key={`pending-${index}`}
                  className="border-2 border-yellow-300 rounded-xl overflow-hidden cursor-pointer group hover:shadow-lg transition-all duration-300"
                  onClick={() => openDoctorModal(item)}
                >
                  <div className="relative w-full h-48 bg-gray-100">
                    <img
                      className="doctor-card-image w-full h-full object-cover"
                      src={item.image || '/assets/profile_pic.png'}
                      alt={item.name}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/assets/profile_pic.png';
                      }}
                    />
                    <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded">
                      Pending
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-[#262626] text-lg font-medium truncate">{item.name}</p>
                    <p className="text-[#5C5C5C] text-sm">{item.speciality}</p>
                    <div className="mt-2 flex space-x-2">
                      <button
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white py-1 px-2 rounded text-sm transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          approveDoctor(item._id);
                        }}
                      >
                        Approve
                      </button>
                      <button
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded text-sm transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          rejectDoctor(item._id);
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Approved Doctors Section */}
      <h2 className="text-md font-semibold text-gray-700 mb-3">Approved Doctors</h2>
      <div className="grid-responsive pt-5">
        {filteredDoctors && filteredDoctors.length > 0 ? (
          filteredDoctors
            .filter((doc) => doc.isApproved)
            .map((item: IDoctorAdmin, index: number) => (
              <div
                key={`approved-${index}`}
                className="border border-[#C9D8FF] rounded-xl overflow-hidden cursor-pointer group hover:shadow-lg transition-all duration-300"
                onClick={() => openDoctorModal(item)}
              >
                <div className="relative w-full h-48 bg-gray-100">
                  <img
                    className="doctor-card-image w-full h-full object-cover"
                    src={item.image || '/assets/profile_pic.png'}
                    alt={item.name}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/assets/profile_pic.png';
                    }}
                  />
                </div>
                <div className="p-4">
                  <p className="text-[#262626] text-lg font-medium truncate">{item.name}</p>
                  <p className="text-[#5C5C5C] text-sm">{item.speciality}</p>
                  <div className="mt-2 flex items-center justify-between gap-1 text-sm">
                    <div className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={item.available}
                        className="cursor-pointer"
                        onChange={() => {
                          console.log('🎯 CHECKBOX CLICKED for doctor:', item.name, 'ID:', item._id);
                          changeAvailability(item._id);
                        }}
                      />
                      <p>Available</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="text-blue-600 hover:text-blue-800 font-medium"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditingDoctor(item);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-600 hover:text-red-800 font-medium"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Are you sure you want to delete this doctor?')) {
                            deleteDoctor(item._id);
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-12 h-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No doctors registered</h3>
            <p className="text-gray-500 mb-6 max-w-md">
              No doctors have been added to the system yet. Start by adding the first doctor to your platform.
            </p>
            <button
              className="bg-primary text-white px-6 py-2 rounded-full hover:bg-primary/90 transition-all cursor-pointer"
              onClick={() => window.location.href = '/admin/add-doctor'}
            >
              Add Doctor
            </button>
          </div>
        )}
      </div>

      {/* Doctor Detail Modal */}
      {isModalOpen && selectedDoctor && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Doctor Details</h2>
                <button className="text-gray-500 hover:text-gray-700" onClick={closeDoctorModal}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3">
                  <div className="relative group w-full aspect-square md:aspect-auto">
                    <img
                      className="w-full rounded-lg object-cover"
                      src={editImagePreview || selectedDoctor.image || '/assets/profile_pic.png'}
                      alt={selectedDoctor.name}
                    />
                    {isEditing && (
                      <label className="absolute inset-0 bg-black/50 hover:bg-black/70 flex flex-col items-center justify-center text-white cursor-pointer rounded-lg transition-all gap-1 text-xs font-semibold">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>Change Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0];
                              setEditImage(file);
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setEditImagePreview(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="md:w-2/3">
                  <div className="space-y-4">
                    {/* Full Name */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-700">Full Name</h3>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full border rounded px-2 py-1"
                        />
                      ) : (
                        <p className="text-gray-900">{selectedDoctor.name}</p>
                      )}
                      {!isEditing && (
                        <button
                          className="text-blue-600 hover:text-blue-800 text-sm"
                          onClick={() => {
                            setEditName(selectedDoctor.name);
                            setEditSpeciality(selectedDoctor.speciality);
                            setEditDegree(selectedDoctor.degree);
                            setEditExperience(selectedDoctor.experience);
                            setEditFees(selectedDoctor.fees?.toString() || '');
                            setEditAbout(selectedDoctor.about);
                            setEditImage(null);
                            setEditImagePreview(selectedDoctor.image || '');
                            setIsEditing(true);
                          }}
                        >
                          Edit
                        </button>
                      )}
                    </div>

                    {/* Speciality */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-700">Speciality</h3>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editSpeciality}
                          onChange={(e) => setEditSpeciality(e.target.value)}
                          className="w-full border rounded px-2 py-1"
                        />
                      ) : (
                        <p className="text-gray-900">{selectedDoctor.speciality}</p>
                      )}
                    </div>

                    {/* Degree */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-700">Degree</h3>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editDegree}
                          onChange={(e) => setEditDegree(e.target.value)}
                          className="w-full border rounded px-2 py-1"
                        />
                      ) : (
                        <p className="text-gray-900">{selectedDoctor.degree || 'Not provided'}</p>
                      )}
                    </div>

                    {/* Experience */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-700">Experience</h3>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editExperience}
                          onChange={(e) => setEditExperience(e.target.value)}
                          className="w-full border rounded px-2 py-1"
                        />
                      ) : (
                        <p className="text-gray-900">{selectedDoctor.experience || 'Not provided'}</p>
                      )}
                    </div>

                    {/* Fees */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-700">Fees</h3>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editFees}
                          onChange={(e) => setEditFees(e.target.value)}
                          className="w-full border rounded px-2 py-1"
                        />
                      ) : (
                        <p className="text-gray-900">
                          ${selectedDoctor.fees ?? 'Not provided'}
                        </p>
                      )}
                    </div>

                    {/* About */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-700">About</h3>
                      {isEditing ? (
                        <textarea
                          rows={3}
                          value={editAbout}
                          onChange={(e) => setEditAbout(e.target.value)}
                          className="w-full border rounded px-2 py-1"
                        />
                      ) : (
                        <p className="text-gray-900">{selectedDoctor.about || 'Not provided'}</p>
                      )}
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                      {isEditing ? (
                        <>
                          <button
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                            onClick={handleSaveEdit}
                          >
                            Save
                          </button>
                          <button
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            onClick={() => {
                              setIsEditing(false);
                              setEditImage(null);
                              setEditImagePreview(selectedDoctor.image || '');
                            }}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={closeDoctorModal}
                        >
                          Close
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorsList;
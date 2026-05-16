"use client";

import { useContext, useEffect, useState } from 'react';
import { AdminContext } from '@/context/AdminContext';
import type { IAdminContext, IPatientAdmin } from '@/models/doctor';

const PatientsList = () => {
  const {
    patients,
    aToken,
    getAllPatients,
    editPatient,
  } = useContext(AdminContext) as IAdminContext;

  const [selectedPatient, setSelectedPatient] = useState<IPatientAdmin | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPatients, setFilteredPatients] = useState<IPatientAdmin[]>([]);

  // Inline edit state
  const [editName, setEditName] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editGender, setEditGender] = useState<string>('');
  const [editDob, setEditDob] = useState<string>('');
  const [editAddressLine1, setEditAddressLine1] = useState<string>('');
  const [editAddressLine2, setEditAddressLine2] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [image, setImage] = useState<File | null>(null);

  useEffect(() => {
    if (aToken) {
      getAllPatients();
    }
  }, [aToken]);

  useEffect(() => {
    if (patients) {
      const filtered = patients.filter((patient) =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone.includes(searchTerm)
      );
      setFilteredPatients(filtered);
    }
  }, [patients, searchTerm]);

  const openPatientModal = (patient: IPatientAdmin) => {
    setSelectedPatient(patient);
    setIsModalOpen(true);
  };

  const closePatientModal = () => {
    setIsModalOpen(false);
    setSelectedPatient(null);
    setIsEditing(false);
    setImage(null);
  };

  const handleSaveEdit = async () => {
    if (!selectedPatient) return;
    const formData = new FormData();
    formData.append('patientId', selectedPatient._id);
    formData.append('name', editName);
    formData.append('email', editEmail);
    formData.append('phone', editPhone);
    formData.append('gender', editGender);
    formData.append('dob', editDob);
    formData.append('addressLine1', editAddressLine1);
    formData.append('addressLine2', editAddressLine2);
    if (image) {
      formData.append('image', image);
    }
    try {
      await editPatient(formData);
      setIsEditing(false);
      closePatientModal();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="m-5 max-h-[90vh] overflow-y-scroll">
      <h1 className="text-lg font-medium">All Patients</h1>

      {/* Search Bar */}
      <div className="my-4">
        <input
          type="text"
          placeholder="Search patients by name, email, or phone..."
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Patients Grid */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pt-5 gap-y-6">
        {filteredPatients && filteredPatients.length > 0 ? (
          filteredPatients.map((item: IPatientAdmin, index: number) => (
            <div
              key={index}
              className="border border-[#C9D8FF] rounded-xl max-w-56 overflow-hidden cursor-pointer group hover:shadow-lg transition-all duration-300"
              onClick={() => openPatientModal(item)}
            >
              <div className="relative w-full h-48 bg-gray-100">
                <img
                  className="w-full h-full object-cover"
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
                <p className="text-[#5C5C5C] text-sm truncate">{item.email}</p>
                <p className="text-[#5C5C5C] text-sm truncate">{item.phone}</p>
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No patients registered
            </h3>
            <p className="text-gray-500 mb-6 max-w-md">
              No patients have been registered in the system yet.
            </p>
          </div>
        )}
      </div>

      {/* Patient Detail Modal */}
      {isModalOpen && selectedPatient && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Patient Details</h2>
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={closePatientModal}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3">
                  {isEditing ? (
                    <label className="inline-block cursor-pointer">
                      <img
                        className="w-full rounded-lg object-cover"
                        src={image ? URL.createObjectURL(image) : selectedPatient.image}
                        alt={selectedPatient.name}
                      />
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setImage(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                  ) : (
                    <img
                      className="w-full rounded-lg object-cover"
                      src={selectedPatient.image}
                      alt={selectedPatient.name}
                    />
                  )}
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
                        <p className="text-gray-900">{selectedPatient.name}</p>
                      )}
                      {!isEditing && (
                        <button
                          className="text-blue-600 hover:text-blue-800 text-sm"
                          onClick={() => {
                            setEditName(selectedPatient.name);
                            setEditEmail(selectedPatient.email);
                            setEditPhone(selectedPatient.phone);
                            setEditGender(selectedPatient.gender);
                            setEditDob(selectedPatient.dob);
                            setEditAddressLine1(selectedPatient.address.line1);
                            setEditAddressLine2(selectedPatient.address.line2);
                            setIsEditing(true);
                          }}
                        >
                          Edit
                        </button>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-700">Email Address</h3>
                      {isEditing ? (
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full border rounded px-2 py-1"
                        />
                      ) : (
                        <p className="text-gray-900">{selectedPatient.email}</p>
                      )}
                    </div>

                    {/* Phone */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-700">Phone Number</h3>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          className="w-full border rounded px-2 py-1"
                        />
                      ) : (
                        <p className="text-gray-900">{selectedPatient.phone}</p>
                      )}
                    </div>

                    {/* Gender */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-700">Gender</h3>
                      {isEditing ? (
                        <select
                          className="w-full border rounded px-2 py-1"
                          value={editGender}
                          onChange={(e) => setEditGender(e.target.value)}
                        >
                          <option value="Not Selected">Not Selected</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      ) : (
                        <p className="text-gray-900">{selectedPatient.gender}</p>
                      )}
                    </div>

                    {/* Date of Birth */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-700">Date of Birth</h3>
                      {isEditing ? (
                        <input
                          type="date"
                          value={editDob}
                          onChange={(e) => setEditDob(e.target.value)}
                          className="w-full border rounded px-2 py-1"
                        />
                      ) : (
                        <p className="text-gray-900">{selectedPatient.dob}</p>
                      )}
                    </div>

                    {/* Address */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-700">Address</h3>
                      {isEditing ? (
                        <>
                          <input
                            type="text"
                            placeholder="Line 1"
                            value={editAddressLine1}
                            onChange={(e) => setEditAddressLine1(e.target.value)}
                            className="w-full border rounded px-2 py-1 mb-1"
                          />
                          <input
                            type="text"
                            placeholder="Line 2"
                            value={editAddressLine2}
                            onChange={(e) => setEditAddressLine2(e.target.value)}
                            className="w-full border rounded px-2 py-1"
                          />
                        </>
                      ) : (
                        <>
                          <p className="text-gray-900">{selectedPatient.address.line1}</p>
                          <p className="text-gray-900">{selectedPatient.address.line2}</p>
                        </>
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
                            onClick={() => setIsEditing(false)}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={closePatientModal}
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

export default PatientsList;
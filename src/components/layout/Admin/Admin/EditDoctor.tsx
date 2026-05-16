"use client";

import { useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useParams, useRouter } from 'next/navigation';

import { AdminContext } from '@/context/AdminContext';
import type { IAdminContext, DoctorProfile } from '@/models/doctor';

const EditDoctor = () => {
  const { docId } = useParams();
  const router = useRouter();
  
  const [docImg, setDocImg] = useState<File | null>(null);
  const [imgPreview, setImgPreview] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [experience, setExperience] = useState<string>('1 Year');
  const [fees, setFees] = useState<string>('');
  const [about, setAbout] = useState<string>('');
  const [speciality, setSpeciality] = useState<string>('General physician');
  const [degree, setDegree] = useState<string>('');
  const [address1, setAddress1] = useState<string>('');
  const [address2, setAddress2] = useState<string>('');

  const { doctors, editDoctor } = useContext(AdminContext) as IAdminContext;

  useEffect(() => {
    if (doctors && docId) {
      const stringDocId = Array.isArray(docId) ? docId[0] : docId;
      const doctor = doctors.find(d => d._id === stringDocId) as unknown as DoctorProfile;
      if (doctor) {
        setName(doctor.name);
        setEmail(doctor.email);
        setExperience(doctor.experience);
        setFees(doctor.fees.toString());
        setAbout(doctor.about);
        setSpeciality(doctor.speciality);
        setDegree(doctor.degree);
        setAddress1(doctor.address?.line1 || '');
        setAddress2(doctor.address?.line2 || '');
        setImgPreview(doctor.image);
      }
    }
  }, [docId, doctors]);

  const onSubmitHandler = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const formData = new FormData();
      const stringDocId = Array.isArray(docId) ? docId[0] : docId;
      formData.append('docId', stringDocId || '');
      formData.append('name', name);
      formData.append('email', email);
      formData.append('experience', experience);
      formData.append('fees', fees);
      formData.append('about', about);
      formData.append('speciality', speciality);
      formData.append('degree', degree);
      formData.append('address', JSON.stringify({ line1: address1, line2: address2 }));

      if (docImg) {
        formData.append('image', docImg);
      }

      await editDoctor(formData);
      router.push('/doctor-list');
    } catch (error: unknown) {
      console.log(error);
      toast.error('An error occurred while updating doctor');
    }
  };

  return (
    <form onSubmit={onSubmitHandler} className="m-5 w-full">
      <p className="mb-3 text-lg font-medium">Edit Doctor Profile</p>

      <div className="bg-white px-8 py-8 border rounded w-full max-w-4xl max-h-[80vh] overflow-y-scroll">
        <div className="flex items-center gap-4 mb-8 text-gray-500">
          <label htmlFor="edit-doc-img">
            <img
              className="w-16 h-16 bg-gray-100 rounded-full cursor-pointer object-cover"
              src={imgPreview || '/assets/profile_pic.png'}
              alt="Doctor preview"
            />
          </label>
          <input
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setDocImg(e.target.files[0]);
                setImgPreview(URL.createObjectURL(e.target.files[0]));
              }
            }}
            type="file"
            id="edit-doc-img"
            hidden
          />
          <p>
            Upload new <br /> picture
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-start gap-10 text-gray-600">
          <div className="w-full lg:flex-1 flex flex-col gap-4">
            <div className="flex-1 flex flex-col gap-1">
              <p>Your name</p>
              <input
                onChange={(e) => setName(e.target.value)}
                value={name}
                className="border rounded px-3 py-2"
                type="text"
                placeholder="Name"
                required
              />
            </div>

            <div className="flex-1 flex flex-col gap-1">
              <p>Doctor Email</p>
              <input
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                className="border rounded px-3 py-2"
                type="email"
                placeholder="Email"
                required
              />
            </div>

            <div className="flex-1 flex flex-col gap-1">
              <p>Experience</p>
              <select
                onChange={(e) => setExperience(e.target.value)}
                value={experience}
                className="border rounded px-2 py-2"
              >
                <option value="1 Year">1 Year</option>
                <option value="2 Year">2 Years</option>
                <option value="3 Year">3 Years</option>
                <option value="4 Year">4 Years</option>
                <option value="5 Year">5 Years</option>
                <option value="6 Year">6 Years</option>
                <option value="8 Year">8 Years</option>
                <option value="9 Year">9 Years</option>
                <option value="10 Year">10 Years</option>
              </select>
            </div>

            <div className="flex-1 flex flex-col gap-1">
              <p>Fees</p>
              <input
                onChange={(e) => setFees(e.target.value)}
                value={fees}
                className="border rounded px-3 py-2"
                type="number"
                placeholder="Doctor fees"
                required
              />
            </div>
          </div>

          <div className="w-full lg:flex-1 flex flex-col gap-4">
            <div className="flex-1 flex flex-col gap-1">
              <p>Speciality</p>
              <select
                onChange={(e) => setSpeciality(e.target.value)}
                value={speciality}
                className="border rounded px-2 py-2"
              >
                <option value="General physician">General physician</option>
                <option value="Gynecologist">Gynecologist</option>
                <option value="Dermatologist">Dermatologist</option>
                <option value="Pediatricians">Pediatricians</option>
                <option value="Neurologist">Neurologist</option>
                <option value="Gastroenterologist">Gastroenterologist</option>
              </select>
            </div>

            <div className="flex-1 flex flex-col gap-1">
              <p>Degree</p>
              <input
                onChange={(e) => setDegree(e.target.value)}
                value={degree}
                className="border rounded px-3 py-2"
                type="text"
                placeholder="Degree"
                required
              />
            </div>

            <div className="flex-1 flex flex-col gap-1">
              <p>Address</p>
              <input
                onChange={(e) => setAddress1(e.target.value)}
                value={address1}
                className="border rounded px-3 py-2"
                type="text"
                placeholder="Address 1"
                required
              />
              <input
                onChange={(e) => setAddress2(e.target.value)}
                value={address2}
                className="border rounded px-3 py-2"
                type="text"
                placeholder="Address 2"
                required
              />
            </div>
          </div>
        </div>

        <div>
          <p className="mt-4 mb-2">About Doctor</p>
          <textarea
            onChange={(e) => setAbout(e.target.value)}
            value={about}
            className="w-full px-4 pt-2 border rounded"
            rows={5}
            placeholder="write about doctor"
          ></textarea>
        </div>

        <button type="submit" className="bg-primary px-10 py-3 mt-4 text-white rounded-full cursor-pointer">
          Update Doctor
        </button>
      </div>
    </form>
  );
};

export default EditDoctor;

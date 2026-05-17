"use client";

import { useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { Eye, EyeOff } from 'lucide-react';

import { AdminContext } from '@/context/AdminContext';
import type { IAdminContext } from '@/models/doctor';
import { smartApi } from '@/utils/smartApi';

const AddDoctor = () => {
  const [docImg, setDocImg] = useState<File | null>(null);
  const [title, setTitle] = useState<string>('Dr.');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [experience, setExperience] = useState<string>('1 Year');
  const [fees, setFees] = useState<string>('');
  const [about, setAbout] = useState<string>('');
  const [speciality, setSpeciality] = useState<string>('General physician');
  const [degree, setDegree] = useState<string>('');
  const [address1, setAddress1] = useState<string>('');
  const [address2, setAddress2] = useState<string>('');
  const [phone, setPhone] = useState<string>('');

  const { aToken } = useContext(AdminContext) as IAdminContext;

  const onSubmitHandler = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      if (!docImg) {
        return toast.error('Image Not Selected');
      }

      const formData = new FormData();

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

      formData.append('image', docImg);
      formData.append('name', formatDoctorName(title, name));
      formData.append('email', email);
      formData.append('phone', phone);
      formData.append('password', password);
      formData.append('experience', experience);
      formData.append('fees', fees);
      formData.append('about', about);
      formData.append('speciality', speciality);
      formData.append('degree', degree);
      formData.append('address', JSON.stringify({ line1: address1, line2: address2 }));

      // console log formdata
      formData.forEach((value, key) => {
        console.log(`${key}: ${value}`);
      });

      const data = await smartApi.post('/api/admin/add-doctor', formData, {
        headers: { aToken }
      }) as any;
      if (data.success) {
        toast.success(data.message);
        setDocImg(null);
        setTitle('Dr.');
        setName('');
        setPassword('');
        setEmail('');
        setPhone('');
        setAddress1('');
        setAddress2('');
        setDegree('');
        setAbout('');
        setFees('');
      } else {
        toast.error(data.message);
      }
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof (error as { message?: unknown }).message === 'string'
      ) {
        toast.error((error as { message: string }).message);
      } else {
        toast.error('An error occurred');
      }
      console.log(error);
    }
  };

  return (
    <form onSubmit={onSubmitHandler} className="m-5 w-full">
      <p className="mb-3 text-lg font-medium">Add Doctor</p>

      <div className="bg-white px-8 py-8 border rounded w-full max-w-4xl max-h-[80vh] overflow-y-scroll">
        <div className="flex items-center gap-4 mb-8 text-gray-500">
          <label htmlFor="doc-img">
            <img
              className="w-16 h-16 bg-gray-100 rounded-full cursor-pointer object-cover"
              src={docImg ? URL.createObjectURL(docImg) : '/assets/upload_area.svg'}
              alt="Doctor preview"
            />
          </label>
          <input
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setDocImg(e.target.files[0]);
              }
            }}
            type="file"
            name=""
            id="doc-img"
            hidden
          />
          <p>
            Upload doctor <br /> picture
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-start gap-10 text-gray-600">
          <div className="w-full lg:flex-1 flex flex-col gap-4">
            <div className="flex-1 flex flex-col gap-1">
              <p>Title</p>
              <input
                onChange={(e) => setTitle(e.target.value)}
                value={title}
                className="border rounded px-3 py-2"
                type="text"
                placeholder="Dr., Prof., etc."
                required
              />
            </div>

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
              <p>Mobile / Phone Number</p>
              <input
                onChange={(e) => setPhone(e.target.value)}
                value={phone}
                className="border rounded px-3 py-2"
                type="tel"
                placeholder="Mobile number"
                required
              />
            </div>

            <div className="flex-1 flex flex-col gap-1">
              <p>Set Password</p>
              <div className="relative flex">
                <input
                  onChange={(e) => setPassword(e.target.value)}
                  value={password}
                  className="border rounded px-3 py-2 w-full pr-10"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
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
          Add doctor
        </button>
      </div>
    </form>
  );
};

export default AddDoctor;

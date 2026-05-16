"use client";

import { useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

import { DoctorContext } from '@/context/DoctorContext';
import { AdminContext } from '@/context/AdminContext';
import type { IDoctorContext } from '@/models/doctor';
import type { IAdminContext } from '@/models/doctor';
import { Button } from '@/components/ui/button';
import { smartApi } from '@/utils/smartApi';
import type { ApiResponse } from '@/models/patient';

const Login = () => {
  const searchParams = useSearchParams();
  const initialRole = searchParams.get('role') === 'doctor' ? 'Doctor' : 'Admin';
  const [state, setState] = useState(initialRole);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { setDToken } = useContext(DoctorContext) as IDoctorContext;
  const { setAToken } = useContext(AdminContext) as IAdminContext;

  const onSubmitHandler = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (state === 'Admin') {
      console.log('🏥 Admin Login: Using encrypted authentication');
      const data = await smartApi.post('/api/admin/login', { email, password }) as ApiResponse<{ token: string }>;
      if (data.success) {
        setAToken(data.token);
        localStorage.setItem('aToken', data.token);
        console.log('\u2705 Admin logged in via Smart API');
      } else {
        toast.error(data.message);
      }
    } else {
      console.log('🩺 Doctor Login: Using encrypted authentication');
      const data = await smartApi.post('/api/doctor/login', { email, password }) as ApiResponse<{ token: string }>;
      if (data.success) {
        setDToken(data.token);
        localStorage.setItem('dToken', data.token);
        console.log('\u2705 Doctor logged in via Smart API');
      } else {
        toast.error(data.message);
      }
    }
  };

  return (
    <form onSubmit={onSubmitHandler} className="min-h-[80vh] flex items-center">
      <div className="flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-[#5E5E5E] text-sm shadow-lg">
        <p className="text-2xl font-semibold m-auto">
          <span className="text-primary">{state}</span> Login
        </p>
        <div className="w-full ">
          <p>Email</p>
          <input
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            className="border border-[#DADADA] rounded w-full p-2 mt-1"
            type="email"
            required
          />
        </div>
        <div className="w-full ">
          <p>Password</p>
          <div className="relative mt-1">
            <input
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              className="border border-[#DADADA] rounded w-full p-2 pr-10"
              type={showPassword ? "text" : "password"}
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
        <Button className="bg-primary text-white w-full py-2 rounded-md text-base cursor-pointer">Login</Button>
        {state === 'Admin' ? (
          <p>
            Doctor Login?{' '}
            <span
              onClick={() => setState('Doctor')}
              className="text-primary underline cursor-pointer"
            >
              Click here
            </span>
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            <p>
              Admin Login?{' '}
              <span
                onClick={() => setState('Admin')}
                className="text-primary underline cursor-pointer"
              >
                Click here
              </span>
            </p>
            <p>
              Don't have an account?{' '}
              <a href="/doctor-register" className="text-primary underline">
                Register as Doctor
              </a>
            </p>
          </div>
        )}
      </div>
    </form>
  );
};

export default Login;

"use client";

import { useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

import { AppContext } from '@/context/AppContext';
import type { IPatientAppContext } from '@/models/patient';
import { smartApi } from '@/utils/smartApi';

const Login = () => {
  const [state, setState] = useState('Sign Up');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const { token, setToken } = useContext(AppContext) as IPatientAppContext;

  const onSubmitHandler = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      if (state === 'Sign Up') {
        console.log('🔐 Authentication: Attempting encrypted registration');
        const data = await smartApi.post('/api/user/register', {
          name,
          email,
          password
        }) as { success: boolean; token?: string; message?: string };

        if (data.success) {
          localStorage.setItem('token', data.token!);
          setToken(data.token!);
          console.log('✅ Registration successful via Smart API');
        } else {
          toast.error(data.message || 'Registration failed');
        }
      } else {
        console.log('🔐 Authentication: Attempting encrypted login');
        const data = await smartApi.post('/api/user/login', { email, password }) as { success: boolean; token?: string; message?: string };

        if (data.success) {
          localStorage.setItem('token', data.token!);
          setToken(data.token!);
          console.log('✅ Login successful via Smart API');
        } else {
          toast.error(data.message || 'Login failed');
        }
      }
    } catch (error) {
      console.error('❌ Authentication error:', error);
      toast.error('Authentication failed. Please try again.');
    }
  };

  useEffect(() => {
    // Speed of light: Prefetch common post-login routes
    router.prefetch('/');
    router.prefetch('/my-appointments');
    router.prefetch('/my-profile');

    if (token) {
      router.push('/');
    }
  }, [token, router]);

  return (
    <form onSubmit={onSubmitHandler} className="min-h-[80vh] flex items-center">
      <div className="flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-[#5E5E5E] text-sm shadow-lg">
        <p className="text-2xl font-semibold">{state === 'Sign Up' ? 'Create Account' : 'Login'}</p>
        <p>Please {state === 'Sign Up' ? 'sign up' : 'log in'} to book appointment</p>
        {state === 'Sign Up' ? (
          <div className="w-full ">
            <p>Full Name</p>
            <input
              onChange={(e) => setName(e.target.value)}
              value={name}
              className="border border-[#DADADA] rounded w-full p-2 mt-1"
              type="text"
              required
            />
          </div>
        ) : null}
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
        <button className="bg-primary text-white w-full py-2 my-2 rounded-md text-base cursor-pointer">
          {state === 'Sign Up' ? 'Create account' : 'Login'}
        </button>
        {state === 'Sign Up' ? (
          <p>
            Already have an account?{' '}
            <span
              onClick={() => setState('Login')}
              className="text-primary underline cursor-pointer"
            >
              Login here
            </span>
          </p>
        ) : (
          <p>
            Create an new account?{' '}
            <span
              onClick={() => setState('Sign Up')}
              className="text-primary underline cursor-pointer"
            >
              Click here
            </span>
          </p>
        )}
      </div>
    </form>
  );
};

export default Login;

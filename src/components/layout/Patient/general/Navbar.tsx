"use client";

import { useContext, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { AppContext } from '@/context/AppContext';
import type { IPatientAppContext } from '@/models/patient';

const Navbar = () => {
  const pathname = usePathname() || '';
  const router = useRouter();

  const [showMenu, setShowMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { token, setToken, userData } = useContext(AppContext) as IPatientAppContext;

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    router.push('/login');
    setShowProfileMenu(false);
  };

  return (
    <div className="sticky top-0 bg-white z-40 flex items-center justify-between text-sm py-4 mb-5 border-b border-b-[#ADADAD]">
      <Image 
        src="/MedicsOnline_logo.png" 
        alt="MedicsOnline Logo" 
        className="h-10 w-auto cursor-pointer"
        onClick={() => router.push('/')}
        width={144}
        height={40}
        priority
      />
      <ul className="md:flex items-start gap-5 font-medium hidden">
        <Link href="/" className={pathname === '/' ? 'active' : ''} >
          <li className="py-1">HOME</li>
          <hr className="border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden" />
        </Link>
        <Link href="/doctors" className={pathname === '/doctors' ? 'active' : ''} >
          <li className="py-1">ALL DOCTORS</li>
          <hr className="border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden" />
        </Link>
        <Link href="/about" className={pathname === '/about' ? 'active' : ''} >
          <li className="py-1">ABOUT</li>
          <hr className="border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden" />
        </Link>
        <Link href="/contact" className={pathname === '/contact' ? 'active' : ''} >
          <li className="py-1">CONTACT</li>
          <hr className="border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden" />
        </Link>
        <Link href="/admin-login?role=doctor" target="_blank" rel="noopener noreferrer">
          <p className="border-2 px-2.5 py-0.5 rounded-full border-primary">Doctor Login</p>
          <hr className="border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden" />
        </Link>
      </ul>

      <div className="flex items-center gap-4 ">
        {token && userData ? (
          <div 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 cursor-pointer group relative"
          >
            <Image 
              className="w-8 h-8 rounded-full object-cover" 
              src={userData.image} 
              alt="Profile" 
              width={32} 
              height={32} 
            />
            <Image 
              className="w-2.5 h-auto" 
              src={'/assets/dropdown_icon.svg'} 
              alt="" 
              width={10} 
              height={6} 
            />
            <div className={`absolute top-0 right-0 pt-14 text-base font-medium text-gray-600 z-20 ${showProfileMenu ? 'block' : 'hidden'} group-hover:block`}>
              <div className="min-w-48 bg-gray-50 rounded flex flex-col gap-4 p-4">
                <p
                  onClick={() => { router.push('/my-profile'); setShowProfileMenu(false); }}
                  className="hover:text-black cursor-pointer"
                >
                  My Profile
                </p>
                <p
                  onClick={() => { router.push('/my-appointments'); setShowProfileMenu(false); }}
                  className="hover:text-black cursor-pointer"
                >
                  My Appointments
                </p>
                <p onClick={logout} className="hover:text-black cursor-pointer">
                  Logout
                </p>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => router.push('/login')}
            className="bg-primary text-white px-8 py-3 rounded-full font-light hidden md:block cursor-pointer"
          >
            Create account
          </button>
        )}
        <img
          onClick={() => setShowMenu(true)}
          className="w-6 md:hidden cursor-pointer"
          src={'/assets/menu_icon.svg'}
          alt=""
        />

        {/* ---- Mobile Menu ---- */}
        <div
          className={`md:hidden ${
            showMenu ? 'fixed w-full' : 'h-0 w-0'
          } right-0 top-0 bottom-0 z-20 overflow-hidden bg-white transition-all`}
        >
          <div className="flex items-center justify-between px-5 py-6">
            <img src="/MedicsOnline_logo.png" className="w-36" alt="MedicsOnline Logo" />
            <img
              onClick={() => setShowMenu(false)}
              src={'/assets/cross_icon.png'}
              className="w-7 cursor-pointer"
              alt=""
            />
          </div>
          <ul className="flex flex-col items-center gap-2 mt-5 px-5 text-lg font-medium">
            <Link href="/" className={pathname === '/' ? 'active' : ''} onClick={() => setShowMenu(false)}>
              <p className="px-4 py-2 rounded full inline-block">HOME</p>
            </Link>
            <Link href="/doctors" className={pathname === '/doctors' ? 'active' : ''} onClick={() => setShowMenu(false)}>
              <p className="px-4 py-2 rounded full inline-block">ALL DOCTORS</p>
            </Link>
            <Link href="/about" className={pathname === '/about' ? 'active' : ''} onClick={() => setShowMenu(false)}>
              <p className="px-4 py-2 rounded full inline-block">ABOUT</p>
            </Link>
            <Link href="/contact" className={pathname === '/contact' ? 'active' : ''} onClick={() => setShowMenu(false)}>
              <p className="px-4 py-2 rounded full inline-block">CONTACT</p>
            </Link>
            <Link href="/admin-login?role=doctor" className={pathname === '/admin-login?role=doctor' ? 'active' : ''} onClick={() => setShowMenu(false)}>
              <p className="px-4 py-2 rounded full inline-block">DOCTOR LOGIN</p>
            </Link>
            {!token && (
              <Link href="/login?state=login" className={pathname === '/login' ? 'active' : ''} onClick={() => setShowMenu(false)}>
                <p className="px-4 py-2 rounded full inline-block">PATIENT LOGIN</p>
              </Link>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Navbar;

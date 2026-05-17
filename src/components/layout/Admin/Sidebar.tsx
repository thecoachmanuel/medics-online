import { useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { DoctorContext } from '@/context/DoctorContext';
import { AdminContext } from '@/context/AdminContext';
import type { IDoctorContext, IAdminContext } from '@/models/doctor';

const Sidebar = () => {
  const pathname = usePathname() || '';
  const { dToken } = useContext(DoctorContext) as IDoctorContext;
  const { aToken } = useContext(AdminContext) as IAdminContext;
  
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setFilterType(params.get('filter') || 'all');
    }
  }, [pathname]);

  return (
    <div className="min-h-screen bg-white border-r">
      {aToken && (
        <ul className="text-[#515151] mt-5">
          <Link
            href={'/admin-dashboard'}
            className={`flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${pathname === '/admin-dashboard' ? 'bg-[#F2F3FF] border-r-4 border-primary font-semibold text-primary' : ''}`}
          >
            <img className="min-w-5" src={'/assets/home_icon.svg'} alt="" />
            <p className="hidden md:block">Dashboard</p>
          </Link>
          <Link
            href={'/all-appointments'}
            className={`flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${pathname === '/all-appointments' && filterType !== 'latest' ? 'bg-[#F2F3FF] border-r-4 border-primary font-semibold text-primary' : ''}`}
          >
            <img className="min-w-5" src={'/assets/appointment_icon.svg'} alt="" />
            <p className="hidden md:block">All Bookings</p>
          </Link>
          <Link
            href={'/all-appointments?filter=latest'}
            className={`flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${pathname === '/all-appointments' && filterType === 'latest' ? 'bg-[#F2F3FF] border-r-4 border-primary font-semibold text-primary' : ''}`}
          >
            <img className="min-w-5" src={'/assets/list_icon.svg'} alt="" />
            <p className="hidden md:block">Latest Bookings</p>
          </Link>
          <Link
            href={'/add-doctor'}
            className={`flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${pathname === '/add-doctor' ? 'bg-[#F2F3FF] border-r-4 border-primary font-semibold text-primary' : ''}`}
          >
            <img className="min-w-5" src={'/assets/add_icon.svg'} alt="" />
            <p className="hidden md:block">Add Doctor</p>
          </Link>
          <Link
            href={'/doctor-list'}
            className={`flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${pathname === '/doctor-list' ? 'bg-[#F2F3FF] border-r-4 border-primary font-semibold text-primary' : ''}`}
          >
            <img className="min-w-5" src={'/assets/people_icon.svg'} alt="" />
            <p className="hidden md:block">Doctors List</p>
          </Link>
          <Link
            href={'/patient-list'}
            className={`flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${pathname === '/patient-list' ? 'bg-[#F2F3FF] border-r-4 border-primary font-semibold text-primary' : ''}`}
          >
            <img className="min-w-5" src={'/assets/people_icon.svg'} alt="" />
            <p className="hidden md:block">Patients List</p>
          </Link>
        </ul>
      )}

      {dToken && (
        <ul className="text-[#515151] mt-5">
          <Link
            href={'/doctor-dashboard'}
            className={`flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${pathname === '/doctor-dashboard' ? 'bg-[#F2F3FF] border-r-4 border-primary font-semibold text-primary' : ''}`}
          >
            <img className="min-w-5" src={'/assets/home_icon.svg'} alt="" />
            <p className="hidden md:block">Dashboard</p>
          </Link>
          <Link
            href={'/doctor-appointments'}
            className={`flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${pathname === '/doctor-appointments' && filterType !== 'latest' ? 'bg-[#F2F3FF] border-r-4 border-primary font-semibold text-primary' : ''}`}
          >
            <img className="min-w-5" src={'/assets/appointment_icon.svg'} alt="" />
            <p className="hidden md:block">All Bookings</p>
          </Link>
          <Link
            href={'/doctor-appointments?filter=latest'}
            className={`flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${pathname === '/doctor-appointments' && filterType === 'latest' ? 'bg-[#F2F3FF] border-r-4 border-primary font-semibold text-primary' : ''}`}
          >
            <img className="min-w-5" src={'/assets/list_icon.svg'} alt="" />
            <p className="hidden md:block">Latest Bookings</p>
          </Link>
          <Link
            href={'/doctor-profile'}
            className={`flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${pathname === '/doctor-profile' ? 'bg-[#F2F3FF] border-r-4 border-primary font-semibold text-primary' : ''}`}
          >
            <img className="min-w-5" src={'/assets/people_icon.svg'} alt="" />
            <p className="hidden md:block">Profile</p>
          </Link>
        </ul>
      )}
    </div>
  );
};

export default Sidebar;

import { useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  CalendarRange, 
  CalendarClock, 
  UserPlus, 
  Users, 
  UserSquare2, 
  ShieldCheck, 
  UserCircle 
} from 'lucide-react';

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
            className={`flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer transition-all duration-200 ${pathname === '/admin-dashboard' ? 'bg-[#F2F3FF] border-r-4 border-primary font-semibold text-primary' : 'hover:bg-gray-50'}`}
          >
            <LayoutDashboard className={`w-5 h-5 shrink-0 ${pathname === '/admin-dashboard' ? 'text-primary' : 'text-[#515151]'}`} />
            <p className="hidden md:block">Dashboard</p>
          </Link>
          <Link
            href={'/all-appointments'}
            className={`flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer transition-all duration-200 ${pathname === '/all-appointments' && filterType !== 'latest' ? 'bg-[#F2F3FF] border-r-4 border-primary font-semibold text-primary' : 'hover:bg-gray-50'}`}
          >
            <CalendarRange className={`w-5 h-5 shrink-0 ${pathname === '/all-appointments' && filterType !== 'latest' ? 'text-primary' : 'text-[#515151]'}`} />
            <p className="hidden md:block">All Bookings</p>
          </Link>
          <Link
            href={'/all-appointments?filter=latest'}
            className={`flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer transition-all duration-200 ${pathname === '/all-appointments' && filterType === 'latest' ? 'bg-[#F2F3FF] border-r-4 border-primary font-semibold text-primary' : 'hover:bg-gray-50'}`}
          >
            <CalendarClock className={`w-5 h-5 shrink-0 ${pathname === '/all-appointments' && filterType === 'latest' ? 'text-primary' : 'text-[#515151]'}`} />
            <p className="hidden md:block">Latest Bookings</p>
          </Link>
          <Link
            href={'/add-doctor'}
            className={`flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer transition-all duration-200 ${pathname === '/add-doctor' ? 'bg-[#F2F3FF] border-r-4 border-primary font-semibold text-primary' : 'hover:bg-gray-50'}`}
          >
            <UserPlus className={`w-5 h-5 shrink-0 ${pathname === '/add-doctor' ? 'text-primary' : 'text-[#515151]'}`} />
            <p className="hidden md:block">Add Doctor</p>
          </Link>
          <Link
            href={'/doctor-list'}
            className={`flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer transition-all duration-200 ${pathname === '/doctor-list' ? 'bg-[#F2F3FF] border-r-4 border-primary font-semibold text-primary' : 'hover:bg-gray-50'}`}
          >
            <Users className={`w-5 h-5 shrink-0 ${pathname === '/doctor-list' ? 'text-primary' : 'text-[#515151]'}`} />
            <p className="hidden md:block">Doctors List</p>
          </Link>
          <Link
            href={'/patient-list'}
            className={`flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer transition-all duration-200 ${pathname === '/patient-list' ? 'bg-[#F2F3FF] border-r-4 border-primary font-semibold text-primary' : 'hover:bg-gray-50'}`}
          >
            <UserSquare2 className={`w-5 h-5 shrink-0 ${pathname === '/patient-list' ? 'text-primary' : 'text-[#515151]'}`} />
            <p className="hidden md:block">Patients List</p>
          </Link>
          <Link
            href={'/kyc-review'}
            className={`flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer transition-all duration-200 ${pathname === '/kyc-review' ? 'bg-[#F2F3FF] border-r-4 border-primary font-semibold text-primary' : 'hover:bg-gray-50'}`}
          >
            <ShieldCheck className={`w-5 h-5 shrink-0 ${pathname === '/kyc-review' ? 'text-primary' : 'text-[#515151]'}`} />
            <p className="hidden md:block">KYC Approvals</p>
          </Link>
        </ul>
      )}

      {dToken && (
        <ul className="text-[#515151] mt-5">
          <Link
            href={'/doctor-dashboard'}
            className={`flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer transition-all duration-200 ${pathname === '/doctor-dashboard' ? 'bg-[#F2F3FF] border-r-4 border-primary font-semibold text-primary' : 'hover:bg-gray-50'}`}
          >
            <LayoutDashboard className={`w-5 h-5 shrink-0 ${pathname === '/doctor-dashboard' ? 'text-primary' : 'text-[#515151]'}`} />
            <p className="hidden md:block">Dashboard</p>
          </Link>
          <Link
            href={'/doctor-appointments'}
            className={`flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer transition-all duration-200 ${pathname === '/doctor-appointments' && filterType !== 'latest' ? 'bg-[#F2F3FF] border-r-4 border-primary font-semibold text-primary' : 'hover:bg-gray-50'}`}
          >
            <CalendarRange className={`w-5 h-5 shrink-0 ${pathname === '/doctor-appointments' && filterType !== 'latest' ? 'text-primary' : 'text-[#515151]'}`} />
            <p className="hidden md:block">All Bookings</p>
          </Link>
          <Link
            href={'/doctor-appointments?filter=latest'}
            className={`flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer transition-all duration-200 ${pathname === '/doctor-appointments' && filterType === 'latest' ? 'bg-[#F2F3FF] border-r-4 border-primary font-semibold text-primary' : 'hover:bg-gray-50'}`}
          >
            <CalendarClock className={`w-5 h-5 shrink-0 ${pathname === '/doctor-appointments' && filterType === 'latest' ? 'text-primary' : 'text-[#515151]'}`} />
            <p className="hidden md:block">Latest Bookings</p>
          </Link>
          <Link
            href={'/doctor-profile'}
            className={`flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer transition-all duration-200 ${pathname === '/doctor-profile' ? 'bg-[#F2F3FF] border-r-4 border-primary font-semibold text-primary' : 'hover:bg-gray-50'}`}
          >
            <UserCircle className={`w-5 h-5 shrink-0 ${pathname === '/doctor-profile' ? 'text-primary' : 'text-[#515151]'}`} />
            <p className="hidden md:block">Profile</p>
          </Link>
          <Link
            href={'/doctor-kyc'}
            className={`flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer transition-all duration-200 ${pathname === '/doctor-kyc' ? 'bg-[#F2F3FF] border-r-4 border-primary font-semibold text-primary' : 'hover:bg-gray-50'}`}
          >
            <ShieldCheck className={`w-5 h-5 shrink-0 ${pathname === '/doctor-kyc' ? 'text-primary' : 'text-[#515151]'}`} />
            <p className="hidden md:block">KYC Verification</p>
          </Link>
        </ul>
      )}
    </div>
  );
};

export default Sidebar;

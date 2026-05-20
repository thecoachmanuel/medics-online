import { useContext } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AppContext } from '@/context/AppContext';

const Header = () => {
  const { cmsData } = useContext(AppContext) as any;
  const cms = cmsData || {};

  return (
    <div className="flex flex-col md:flex-row flex-wrap bg-primary rounded-lg px-6 md:px-10 lg:px-20 ">
      {/* --------- Header Left --------- */}
      <div className="md:w-1/2 flex flex-col items-start justify-center gap-4 py-10 m-auto md:py-[10vw] md:mb-[-30px]">
        <p className="text-3xl md:text-4xl lg:text-5xl text-white font-semibold leading-tight md:leading-tight lg:leading-tight">
          {cms.homeHeaderTitle || 'Consult with Trusted Doctors Online'}
        </p>
        <div className="flex flex-col md:flex-row items-center gap-3 text-white text-sm font-light">
          <Image className="w-28 h-auto" src={'/assets/group_profiles.webp'} alt="" width={112} height={40} priority />
          <p>
            {cms.homeHeaderSubtitle || 'Book appointments, consult via video, and manage your healthcare journey all in one secure platform.'}
          </p>
        </div>
        <Link
          href={cms.homeHeaderBtnLink || '/doctors'}
          className="flex items-center gap-2 bg-white px-8 py-3 rounded-full text-[#595959] text-sm m-auto md:m-0 hover:scale-105 transition-all duration-300 cursor-pointer"
        >
          {cms.homeHeaderBtnText || 'Book appointment'}{' '}
          <Image className="w-3 h-auto" src={'/assets/arrow_icon.svg'} alt="" width={12} height={12} />
        </Link>
      </div>

      {/* --------- Header Right --------- */}
      <div className="md:w-1/2 relative min-h-[300px] md:min-h-0 flex items-end">
        <img
          className="w-full md:absolute bottom-0 h-auto rounded-lg object-contain max-h-[105%]"
          src={cms.homeHeaderImage || '/assets/header_img.webp'}
          alt="Banner"
        />
      </div>
    </div>
  );
};

export default Header;

import Image from 'next/image';
import Link from 'next/link';

const Header = () => {
  return (
    <div className="flex flex-col md:flex-row flex-wrap bg-primary rounded-lg px-6 md:px-10 lg:px-20 ">
      {/* --------- Header Left --------- */}
      <div className="md:w-1/2 flex flex-col items-start justify-center gap-4 py-10 m-auto md:py-[10vw] md:mb-[-30px]">
        <p className="text-3xl md:text-4xl lg:text-5xl text-white font-semibold leading-tight md:leading-tight lg:leading-tight">
          Connect with Trusted Doctors <br /> Online
        </p>
        <div className="flex flex-col md:flex-row items-center gap-3 text-white text-sm font-light">
          <Image className="w-28 h-auto" src={'/assets/group_profiles.png'} alt="" width={112} height={40} priority />
          <p>
            Simply browse through our extensive list of trusted doctors,{' '}
            <br className="hidden sm:block" />book appointments, consult via video.
          </p>
        </div>
        <Link
          href="/doctors"
          className="flex items-center gap-2 bg-white px-8 py-3 rounded-full text-[#595959] text-sm m-auto md:m-0 hover:scale-105 transition-all duration-300 cursor-pointer"
        >
          Book appointment <Image className="w-3 h-auto" src={'/assets/arrow_icon.svg'} alt="" width={12} height={12} />
        </Link>
      </div>

      {/* --------- Header Right --------- */}
      <div className="md:w-1/2 relative">
        <Image
          className="w-full md:absolute bottom-0 h-auto rounded-lg"
          src={'/assets/header_img.png'}
          alt=""
          width={500}
          height={500}
          priority
        />
      </div>
    </div>
  );
};

export default Header;

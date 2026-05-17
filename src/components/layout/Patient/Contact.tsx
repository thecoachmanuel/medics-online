import { useContext } from 'react';
import Image from 'next/image';
import { AppContext } from '@/context/AppContext';

const Contact = () => {
  const { cmsData } = useContext(AppContext) as any;
  const cms = cmsData || {};

  return (
    <div>
      <div className="text-center text-2xl pt-10 text-[#707070]">
        <p>
          {cms.contactTitle ? cms.contactTitle.split(' ')[0] : 'CONTACT'}{' '}
          <span className="text-gray-700 font-semibold">
            {cms.contactTitle ? cms.contactTitle.split(' ').slice(1).join(' ') : 'US'}
          </span>
        </p>
      </div>

      <div className="my-10 flex flex-col justify-center md:flex-row gap-10 mb-28 text-sm">
        <img
          className="w-full md:max-w-[360px] h-auto rounded-lg object-cover"
          src={cms.contactImage || '/assets/contact_image.webp'}
          alt="Contact"
        />
        <div className="flex flex-col justify-center items-start gap-6">
          <p className=" font-semibold text-lg text-gray-600">
            {cms.contactOfficeTitle || 'OUR OFFICE'}
          </p>
          <p className=" text-gray-500 whitespace-pre-line">
            {cms.contactAddress || 'Lagos\nNigeria'}
          </p>
          <p className=" text-gray-500">
            Tel: {cms.contactPhone || '+234-703-858-7375'} <br />
            Email: {cms.contactEmail || 'medicsonlineng@gmail.com'}
          </p>
          <p className=" font-semibold text-lg text-gray-600">
            {cms.contactCareerTitle || 'CAREERS AT MedicsOnline'}
          </p>
          <p className=" text-gray-500">
            {cms.contactCareerText || 'Learn more about our teams and job openings.'}
          </p>
          <button className="border border-black px-8 py-4 text-sm hover:bg-black hover:text-white transition-all duration-500 cursor-pointer">
            {cms.contactExploreBtnText || 'Explore Jobs'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Contact;

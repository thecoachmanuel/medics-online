import { useContext } from 'react';
import Image from 'next/image';
import { AppContext } from '@/context/AppContext';

const About = () => {
  const { cmsData } = useContext(AppContext) as any;
  const cms = cmsData || {};

  return (
    <div>
      <div className="text-center text-2xl pt-10 text-[#707070]">
        <p>
          {cms.aboutTitle ? cms.aboutTitle.split(' ')[0] : 'ABOUT'}{' '}
          <span className="text-gray-700 font-semibold">
            {cms.aboutTitle ? cms.aboutTitle.split(' ').slice(1).join(' ') : 'US'}
          </span>
        </p>
      </div>

      <div className="my-10 flex flex-col md:flex-row gap-12">
        <img
          className="w-full md:max-w-[360px] h-auto rounded-lg object-cover"
          src={cms.aboutImage || '/assets/about_image.webp'}
          alt="About Us"
        />
        <div className="flex flex-col justify-center gap-6 md:w-2/4 text-sm text-gray-600">
          <p>{cms.aboutText1}</p>
          <p>{cms.aboutText2}</p>
          <b className="text-gray-800">{cms.aboutVisionTitle || 'Our Vision'}</b>
          <p>{cms.aboutVisionText}</p>
        </div>
      </div>

      <div className="text-xl my-4">
        <p>
          {cms.chooseUsTitle ? cms.chooseUsTitle.split(' ')[0] : 'WHY'}{' '}
          <span className="text-gray-700 font-semibold">
            {cms.chooseUsTitle ? cms.chooseUsTitle.split(' ').slice(1).join(' ') : 'CHOOSE US'}
          </span>
        </p>
      </div>

      <div className="flex flex-col md:flex-row mb-20">
        <div className="border px-10 md:px-16 py-8 sm:py-16 flex flex-col gap-5 text-[15px] hover:bg-primary hover:text-white transition-all duration-300 text-gray-600 cursor-pointer flex-1">
          <b>{cms.chooseUsEfficiencyTitle || 'EFFICIENCY:'}</b>
          <p>{cms.chooseUsEfficiencyText}</p>
        </div>
        <div className="border px-10 md:px-16 py-8 sm:py-16 flex flex-col gap-5 text-[15px] hover:bg-primary hover:text-white transition-all duration-300 text-gray-600 cursor-pointer flex-1">
          <b>{cms.chooseUsConvenienceTitle || 'CONVENIENCE:'}</b>
          <p>{cms.chooseUsConvenienceText}</p>
        </div>
        <div className="border px-10 md:px-16 py-8 sm:py-16 flex flex-col gap-5 text-[15px] hover:bg-primary hover:text-white transition-all duration-300 text-gray-600 cursor-pointer flex-1">
          <b>{cms.chooseUsPersonalizationTitle || 'PERSONALIZATION:'}</b>
          <p>{cms.chooseUsPersonalizationText}</p>
        </div>
      </div>
    </div>
  );
};

export default About;

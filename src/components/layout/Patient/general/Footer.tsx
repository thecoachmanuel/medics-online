import Link from 'next/link';
const Footer = () => {
  return (
    <div className="md:mx-10">
      <div className="flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10  mt-40 text-sm">
        <div>
          <img src="/MedicsOnline_logo.png" alt="MedicsOnline Logo" className="mb-4 h-12" />
          <p className="w-full md:w-2/3 text-gray-600 leading-6">
            Your trusted healthcare partner providing quality medical consultations with certified doctors online, Online.
          </p>
        </div>

        <div>
          <p className="text-xl font-medium mb-5">COMPANY</p>
          <ul className="flex flex-col gap-2 text-gray-600">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/about">About us</Link></li>
            <li><Link href="/contact">Contact us</Link></li>
            <li><a href="/privacy-policy">Privacy policy</a></li>
          </ul>
        </div>

        <div>
          <p className="text-xl font-medium mb-5">GET IN TOUCH</p>
          <ul className="flex flex-col gap-2 text-gray-600">
            <li>+234-703-858-7375</li>
            <li>medicsonlineng@gmail.com</li>
          </ul>
        </div>
      </div>

      <div>
        <hr />
        <p className="py-5 text-sm text-center">
          Copyright 2026 @ medicsonline.ng - All Right Reserved.
        </p>
      </div>
    </div>
  );
};

export default Footer;

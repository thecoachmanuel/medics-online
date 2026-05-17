import mongoose from 'mongoose';

const cmsSchema = new mongoose.Schema({
  // Home page parameters
  homeHeaderTitle: { type: String, default: 'Connect with Trusted Doctors Online' },
  homeHeaderSubtitle: { type: String, default: 'Simply browse through our extensive list of trusted doctors, book appointments, consult via video.' },
  homeHeaderImage: { type: String, default: '/assets/header_img.webp' },
  homeHeaderBtnText: { type: String, default: 'Book appointment' },
  homeHeaderBtnLink: { type: String, default: '/doctors' },
  
  // About page parameters
  aboutTitle: { type: String, default: 'ABOUT US' },
  aboutImage: { type: String, default: '/assets/about_image.webp' },
  aboutText1: { type: String, default: 'Welcome to MedicsOnline, your trusted partner in managing your healthcare needs conveniently and efficiently. At MedicsOnline, we understand the challenges individuals face when it comes to scheduling doctor appointments and managing their health records.' },
  aboutText2: { type: String, default: 'MedicsOnline is committed to excellence in healthcare technology. We continuously strive to enhance our platform, integrating the latest advancements to improve user experience and deliver superior service. Whether you\'re booking your first appointment or managing ongoing care, MedicsOnline is here to support you every step of the way.' },
  aboutVisionTitle: { type: String, default: 'Our Vision' },
  aboutVisionText: { type: String, default: 'Our vision at MedicsOnline is to create a seamless healthcare experience for every user. We aim to bridge the gap between patients and healthcare providers, making it easier for you to access the care you need, when you need it.' },
  
  // Choosing Us sections
  chooseUsTitle: { type: String, default: 'WHY CHOOSE US' },
  chooseUsEfficiencyTitle: { type: String, default: 'EFFICIENCY:' },
  chooseUsEfficiencyText: { type: String, default: 'Streamlined appointment scheduling that fits into your busy lifestyle.' },
  chooseUsConvenienceTitle: { type: String, default: 'CONVENIENCE:' },
  chooseUsConvenienceText: { type: String, default: 'Access to a network of trusted healthcare professionals in your area.' },
  chooseUsPersonalizationTitle: { type: String, default: 'PERSONALIZATION:' },
  chooseUsPersonalizationText: { type: String, default: 'Tailored recommendations and reminders to help you stay on top of your health.' },

  // Contact page parameters
  contactTitle: { type: String, default: 'CONTACT US' },
  contactImage: { type: String, default: '/assets/contact_image.webp' },
  contactOfficeTitle: { type: String, default: 'OUR OFFICE' },
  contactAddress: { type: String, default: 'Lagos\nNigeria' },
  contactPhone: { type: String, default: '+234-703-858-7375' },
  contactEmail: { type: String, default: 'medicsonlineng@gmail.com' },
  contactCareerTitle: { type: String, default: 'CAREERS AT MedicsOnline' },
  contactCareerText: { type: String, default: 'Learn more about our teams and job openings.' },
  contactExploreBtnText: { type: String, default: 'Explore Jobs' }
}, { timestamps: true });

const cmsModel = mongoose.models.cms || mongoose.model('cms', cmsSchema);

export default cmsModel;

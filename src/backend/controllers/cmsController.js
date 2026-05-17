import cmsModel from '../models/cmsModel.js';
import { v2 as cloudinary } from 'cloudinary';

// API to get/initialize global CMS data
const getCmsData = async (req, res) => {
  try {
    let cms = await cmsModel.findOne({});
    if (!cms) {
      // Lazily seed a default document
      cms = new cmsModel({});
      await cms.save();
    }
    res.json({ success: true, cms });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to update CMS configurations (Secured Admin action)
const updateCmsData = async (req, res) => {
  try {
    const {
      homeHeaderTitle,
      homeHeaderSubtitle,
      homeHeaderBtnText,
      homeHeaderBtnLink,
      aboutTitle,
      aboutText1,
      aboutText2,
      aboutVisionTitle,
      aboutVisionText,
      chooseUsTitle,
      chooseUsEfficiencyTitle,
      chooseUsEfficiencyText,
      chooseUsConvenienceTitle,
      chooseUsConvenienceText,
      chooseUsPersonalizationTitle,
      chooseUsPersonalizationText,
      contactTitle,
      contactOfficeTitle,
      contactAddress,
      contactPhone,
      contactEmail,
      contactCareerTitle,
      contactCareerText,
      contactExploreBtnText,

      // Base64 Image Upload Strings
      homeHeaderImageBase64,
      aboutImageBase64,
      contactImageBase64
    } = req.body;

    let cms = await cmsModel.findOne({});
    if (!cms) {
      cms = new cmsModel({});
    }

    // Map textual fields
    if (homeHeaderTitle !== undefined) cms.homeHeaderTitle = homeHeaderTitle;
    if (homeHeaderSubtitle !== undefined) cms.homeHeaderSubtitle = homeHeaderSubtitle;
    if (homeHeaderBtnText !== undefined) cms.homeHeaderBtnText = homeHeaderBtnText;
    if (homeHeaderBtnLink !== undefined) cms.homeHeaderBtnLink = homeHeaderBtnLink;

    if (aboutTitle !== undefined) cms.aboutTitle = aboutTitle;
    if (aboutText1 !== undefined) cms.aboutText1 = aboutText1;
    if (aboutText2 !== undefined) cms.aboutText2 = aboutText2;
    if (aboutVisionTitle !== undefined) cms.aboutVisionTitle = aboutVisionTitle;
    if (aboutVisionText !== undefined) cms.aboutVisionText = aboutVisionText;

    if (chooseUsTitle !== undefined) cms.chooseUsTitle = chooseUsTitle;
    if (chooseUsEfficiencyTitle !== undefined) cms.chooseUsEfficiencyTitle = chooseUsEfficiencyTitle;
    if (chooseUsEfficiencyText !== undefined) cms.chooseUsEfficiencyText = chooseUsEfficiencyText;
    if (chooseUsConvenienceTitle !== undefined) cms.chooseUsConvenienceTitle = chooseUsConvenienceTitle;
    if (chooseUsConvenienceText !== undefined) cms.chooseUsConvenienceText = chooseUsConvenienceText;
    if (chooseUsPersonalizationTitle !== undefined) cms.chooseUsPersonalizationTitle = chooseUsPersonalizationTitle;
    if (chooseUsPersonalizationText !== undefined) cms.chooseUsPersonalizationText = chooseUsPersonalizationText;

    if (contactTitle !== undefined) cms.contactTitle = contactTitle;
    if (contactOfficeTitle !== undefined) cms.contactOfficeTitle = contactOfficeTitle;
    if (contactAddress !== undefined) cms.contactAddress = contactAddress;
    if (contactPhone !== undefined) cms.contactPhone = contactPhone;
    if (contactEmail !== undefined) cms.contactEmail = contactEmail;
    if (contactCareerTitle !== undefined) cms.contactCareerTitle = contactCareerTitle;
    if (contactCareerText !== undefined) cms.contactCareerText = contactCareerText;
    if (contactExploreBtnText !== undefined) cms.contactExploreBtnText = contactExploreBtnText;

    // Process real-time image uploads via Cloudinary
    if (homeHeaderImageBase64) {
      console.log('☁️ Uploading CMS Home Header Image to Cloudinary...');
      const uploadRes = await cloudinary.uploader.upload(homeHeaderImageBase64, {
        resource_type: 'image'
      });
      cms.homeHeaderImage = uploadRes.secure_url;
    }

    if (aboutImageBase64) {
      console.log('☁️ Uploading CMS About Image to Cloudinary...');
      const uploadRes = await cloudinary.uploader.upload(aboutImageBase64, {
        resource_type: 'image'
      });
      cms.aboutImage = uploadRes.secure_url;
    }

    if (contactImageBase64) {
      console.log('☁️ Uploading CMS Contact Image to Cloudinary...');
      const uploadRes = await cloudinary.uploader.upload(contactImageBase64, {
        resource_type: 'image'
      });
      cms.contactImage = uploadRes.secure_url;
    }

    await cms.save();
    res.json({ success: true, message: 'CMS updated successfully!', cms });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export {
  getCmsData,
  updateCmsData
};

"use client";

import { useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  Database, 
  AlertTriangle, 
  Trash2, 
  CheckCircle, 
  Mail, 
  Edit3, 
  Save, 
  Send, 
  HelpCircle, 
  Layers, 
  Settings, 
  RefreshCw,
  Users,
  Megaphone,
  Shield,
  Image as ImageIcon,
  Link as LinkIcon,
  Phone,
  MapPin,
  Briefcase
} from 'lucide-react';

import { AdminContext } from '@/context/AdminContext';
import type { IAdminContext, IEmailTemplate } from '@/models/doctor';
import { smartApi } from '@/utils/smartApi';

const AdminSettings = () => {
  const { 
    aToken, 
    getEmailTemplates, 
    updateEmailTemplate, 
    sendAppointmentReminders,
    cmsData,
    getCmsData,
    updateCmsData,
    sendBulkEmail,
    doctors,
    patients,
    admins,
    getAllAdmins,
    createAdminStaff,
    updateAdminStaff,
    deleteAdminStaff,
    adminProfile
  } = useContext(AdminContext) as any;

  const [activeTab, setActiveTab] = useState<'cms' | 'emails' | 'broadcast' | 'maintenance' | 'roles'>('cms');
  const [previewMode, setPreviewMode] = useState<'edit' | 'visual'>('edit');

  const getCompiledPreview = (htmlString: string) => {
    let compiled = htmlString;
    const mockVars: Record<string, string> = {
      patientName: 'Jane Doe',
      doctorName: 'Dr. Manuel Smith',
      appointmentDate: '25th May 2026',
      appointmentTime: '10:00 AM',
      doctorNetShare: '16,000',
      commissionRate: '20',
      reason: 'Medical record licensing document was unclear.',
      patientEmail: 'jane.doe@example.com',
      doctorEmail: 'manuel.smith@example.com',
      userName: 'John Doe',
      userEmail: 'john.doe@example.com',
      userRole: 'Doctor',
      signupTime: new Date().toLocaleString()
    };
    
    Object.entries(mockVars).forEach(([key, val]) => {
      compiled = compiled.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), val);
    });
    return compiled;
  };

  // ==========================================
  // Staff Administration States
  // ==========================================
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminPermissions, setNewAdminPermissions] = useState<any>({
    dashboard: true,
    appointments: true,
    doctors: true,
    patients: true,
    payouts: true,
    settings: false
  });
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);

  // ==========================================
  // 1. CMS Page States & Setup
  // ==========================================
  const [cmsFields, setCmsFields] = useState<Record<string, string>>({
    homeHeaderTitle: '',
    homeHeaderSubtitle: '',
    homeHeaderBtnText: '',
    homeHeaderBtnLink: '',
    aboutTitle: '',
    aboutText1: '',
    aboutText2: '',
    aboutVisionTitle: '',
    aboutVisionText: '',
    chooseUsTitle: '',
    chooseUsEfficiencyTitle: '',
    chooseUsEfficiencyText: '',
    chooseUsConvenienceTitle: '',
    chooseUsConvenienceText: '',
    chooseUsPersonalizationTitle: '',
    chooseUsPersonalizationText: '',
    contactTitle: '',
    contactOfficeTitle: '',
    contactAddress: '',
    contactPhone: '',
    contactEmail: '',
    contactCareerTitle: '',
    contactCareerText: '',
    contactExploreBtnText: ''
  });

  const [homeHeaderImgBase64, setHomeHeaderImgBase64] = useState('');
  const [aboutImgBase64, setAboutImgBase64] = useState('');
  const [contactImgBase64, setContactImgBase64] = useState('');

  const [homeHeaderPreview, setHomeHeaderPreview] = useState('');
  const [aboutPreview, setAboutPreview] = useState('');
  const [contactPreview, setContactPreview] = useState('');

  const [isUpdatingCms, setIsUpdatingCms] = useState(false);

  useEffect(() => {
    if (cmsData) {
      setCmsFields({
        homeHeaderTitle: cmsData.homeHeaderTitle || '',
        homeHeaderSubtitle: cmsData.homeHeaderSubtitle || '',
        homeHeaderBtnText: cmsData.homeHeaderBtnText || '',
        homeHeaderBtnLink: cmsData.homeHeaderBtnLink || '',
        aboutTitle: cmsData.aboutTitle || '',
        aboutText1: cmsData.aboutText1 || '',
        aboutText2: cmsData.aboutText2 || '',
        aboutVisionTitle: cmsData.aboutVisionTitle || '',
        aboutVisionText: cmsData.aboutVisionText || '',
        chooseUsTitle: cmsData.chooseUsTitle || '',
        chooseUsEfficiencyTitle: cmsData.chooseUsEfficiencyTitle || '',
        chooseUsEfficiencyText: cmsData.chooseUsEfficiencyText || '',
        chooseUsConvenienceTitle: cmsData.chooseUsConvenienceTitle || '',
        chooseUsConvenienceText: cmsData.chooseUsConvenienceText || '',
        chooseUsPersonalizationTitle: cmsData.chooseUsPersonalizationTitle || '',
        chooseUsPersonalizationText: cmsData.chooseUsPersonalizationText || '',
        contactTitle: cmsData.contactTitle || '',
        contactOfficeTitle: cmsData.contactOfficeTitle || '',
        contactAddress: cmsData.contactAddress || '',
        contactPhone: cmsData.contactPhone || '',
        contactEmail: cmsData.contactEmail || '',
        contactCareerTitle: cmsData.contactCareerTitle || '',
        contactCareerText: cmsData.contactCareerText || '',
        contactExploreBtnText: cmsData.contactExploreBtnText || ''
      });
      setHomeHeaderPreview(cmsData.homeHeaderImage || '');
      setAboutPreview(cmsData.aboutImage || '');
      setContactPreview(cmsData.contactImage || '');
    }
  }, [cmsData]);

  // Handle local file read to base64 preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, targetImg: 'home' | 'about' | 'contact') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      return toast.warning('Image size must be less than 2MB');
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Str = reader.result as string;
      if (targetImg === 'home') {
        setHomeHeaderImgBase64(base64Str);
        setHomeHeaderPreview(base64Str);
      } else if (targetImg === 'about') {
        setAboutImgBase64(base64Str);
        setAboutPreview(base64Str);
      } else if (targetImg === 'contact') {
        setContactImgBase64(base64Str);
        setContactPreview(base64Str);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCmsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsUpdatingCms(true);
      const payload = {
        ...cmsFields,
        homeHeaderImageBase64: homeHeaderImgBase64 || undefined,
        aboutImageBase64: aboutImgBase64 || undefined,
        contactImageBase64: contactImgBase64 || undefined
      };

      const ok = await updateCmsData(payload);
      if (ok) {
        // Reset base64 updates
        setHomeHeaderImgBase64('');
        setAboutImgBase64('');
        setContactImgBase64('');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update CMS layout');
    } finally {
      setIsUpdatingCms(false);
    }
  };

  // ==========================================
  // 2. Email Notification states
  // ==========================================
  const [templates, setTemplates] = useState<IEmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<IEmailTemplate | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [isSendingReminders, setIsSendingReminders] = useState(false);

  const loadTemplates = async () => {
    if (!aToken) return;
    try {
      setIsLoadingTemplates(true);
      const list = await getEmailTemplates();
      setTemplates(list);
      if (list.length > 0) {
        setSelectedTemplate(list[0]);
        setSubject(list[0].subject);
        setBody(list[0].body);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'emails' && aToken) {
      loadTemplates();
    }
  }, [activeTab, aToken]);

  const handleSelectTemplate = (temp: IEmailTemplate) => {
    setSelectedTemplate(temp);
    setSubject(temp.subject);
    setBody(temp.body);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    try {
      setIsSavingTemplate(true);
      const ok = await updateEmailTemplate(selectedTemplate._id, subject, body);
      if (ok) {
        const list = await getEmailTemplates();
        setTemplates(list);
        const updated = list.find((t: any) => t._id === selectedTemplate._id);
        if (updated) {
          setSelectedTemplate(updated);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleTriggerReminders = async () => {
    try {
      setIsSendingReminders(true);
      await sendAppointmentReminders();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSendingReminders(false);
    }
  };

  // ==========================================
  // 3. Direct Broadcast / Mass Mailer states
  // ==========================================
  const [recipientType, setRecipientType] = useState<'all-patients' | 'all-doctors' | 'selected-users' | 'custom-emails'>('all-patients');
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [customEmails, setCustomEmails] = useState('');
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const handleSelectedEmailsChange = (email: string) => {
    if (selectedEmails.includes(email)) {
      setSelectedEmails(prev => prev.filter(e => e !== email));
    } else {
      setSelectedEmails(prev => [...prev, email]);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastSubject || !broadcastBody) {
      return toast.warning('Please input a valid subject and mail body content');
    }

    if (recipientType === 'selected-users' && selectedEmails.length === 0) {
      return toast.warning('Please select at least one recipient user');
    }

    if (recipientType === 'custom-emails' && !customEmails.trim()) {
      return toast.warning('Please input target custom email addresses');
    }

    try {
      setIsBroadcasting(true);
      const payload = {
        recipientType,
        selectedEmails: recipientType === 'selected-users' ? selectedEmails : undefined,
        customEmails: recipientType === 'custom-emails' ? customEmails : undefined,
        subject: broadcastSubject,
        body: broadcastBody
      };

      const success = await sendBulkEmail(payload);
      if (success) {
        setBroadcastSubject('');
        setBroadcastBody('');
        setSelectedEmails([]);
        setCustomEmails('');
      }
    } catch (err: any) {
      toast.error(err.message || 'Mass broadcast aborted');
    } finally {
      setIsBroadcasting(false);
    }
  };

  // ==========================================
  // 4. Maintenance / Database purge states
  // ==========================================
  const [target, setTarget] = useState<'doctors' | 'appointments' | 'patients'>('appointments');
  const [confirmText, setConfirmText] = useState('');
  const [isClearing, setIsClearing] = useState(false);

  const handleClearData = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!aToken) {
      return toast.error('Unauthorized access');
    }

    if (confirmText !== 'CLEAR') {
      return toast.warning("Please type 'CLEAR' exactly in the input box to authorize deletion");
    }

    const confirmTwice = window.confirm(
      `⚠️ WARNING: This will permanently erase all data in the ${target.toUpperCase()} collection. This action is 100% IRREVERSIBLE. Are you absolutely sure?`
    );
    if (!confirmTwice) return;

    try {
      setIsClearing(true);
      const data = await smartApi.post(
        '/api/admin/clear-data',
        { target },
        { headers: { aToken } }
      ) as { success: boolean; message: string };

      if (data.success) {
        toast.success(data.message || 'Selected data cleared successfully!');
        setConfirmText('');
      } else {
        toast.error(data.message || 'Failed to clear data');
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred while clearing data');
    } finally {
      setIsClearing(false);
    }
  };

  const handleEnrollAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminName || !newAdminEmail || !newAdminPassword) {
      return toast.warning('Please fill in name, email, and password fields');
    }
    setIsCreatingAdmin(true);
    const success = await createAdminStaff({
      name: newAdminName,
      email: newAdminEmail,
      password: newAdminPassword,
      permissions: newAdminPermissions
    });
    setIsCreatingAdmin(false);
    if (success) {
      setNewAdminName('');
      setNewAdminEmail('');
      setNewAdminPassword('');
      setNewAdminPermissions({
        dashboard: true,
        appointments: true,
        doctors: true,
        patients: true,
        payouts: true,
        settings: false
      });
    }
  };

  return (
    <div className="m-5 w-full max-w-5xl">
      <div className="flex items-center gap-2 mb-1">
        <Settings className="w-6 h-6 text-primary" />
        <h1 className="text-xl font-bold text-gray-800">Settings & Content Dashboard</h1>
      </div>
      <p className="text-xs text-gray-500 mb-6">
        Full administrative control over frontend landing text, transactional notifications, mail merges, and database engines.
      </p>

      {/* Tab Switcher */}
      <div className="flex border-b mb-6 gap-6 overflow-x-auto">
        {[
          { key: 'cms', label: 'Sleek CMS Manager', icon: Edit3 },
          { key: 'emails', label: 'Email Templates Manager', icon: Mail },
          { key: 'broadcast', label: 'Direct Broadcast Mailer', icon: Megaphone },
          { key: 'maintenance', label: 'System Maintenance', icon: Database },
          ...(adminProfile?.role === 'master' ? [{ key: 'roles', label: 'Staff Roles & Access', icon: Shield }] : [])
        ].map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`pb-3 font-semibold text-sm transition-all duration-200 relative cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === tab.key ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <IconComponent className="w-4 h-4" />
              {tab.label}
              {activeTab === tab.key && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full" />}
            </button>
          );
        })}
      </div>

      {/* ========================================================
          TAB 1: CMS SECTION LAYOUT MANAGER
          ======================================================== */}
      {activeTab === 'cms' && (
        <form onSubmit={handleCmsSave} className="space-y-8 max-w-4xl">
          {/* Hero Banner CMS */}
          <div className="bg-white border rounded-xl p-6 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-gray-800 border-b pb-3 flex items-center gap-2">
              <Layers className="w-4.5 h-4.5 text-primary" />
              Patient Homepage Header Section
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Hero Section Title
                  </label>
                  <input
                    type="text"
                    value={cmsFields.homeHeaderTitle}
                    onChange={(e) => setCmsFields(prev => ({ ...prev, homeHeaderTitle: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Hero Section Subtitle
                  </label>
                  <textarea
                    rows={2}
                    value={cmsFields.homeHeaderSubtitle}
                    onChange={(e) => setCmsFields(prev => ({ ...prev, homeHeaderSubtitle: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Button Text
                    </label>
                    <input
                      type="text"
                      value={cmsFields.homeHeaderBtnText}
                      onChange={(e) => setCmsFields(prev => ({ ...prev, homeHeaderBtnText: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Button Router Path/Link
                    </label>
                    <input
                      type="text"
                      value={cmsFields.homeHeaderBtnLink}
                      onChange={(e) => setCmsFields(prev => ({ ...prev, homeHeaderBtnLink: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>
                </div>
              </div>
              
              {/* Image upload widget */}
              <div className="md:col-span-1 flex flex-col items-center justify-center border-l pl-0 md:pl-6">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Hero Image Banner
                </label>
                <div className="relative group w-40 h-40 border rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center">
                  {homeHeaderPreview ? (
                    <img src={homeHeaderPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-gray-300" />
                  )}
                  <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-all duration-200 cursor-pointer">
                    Change Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'home')}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-[10px] text-gray-400 mt-2">Recommended: transparent PNG / WebP</p>
              </div>
            </div>
          </div>

          {/* About Us CMS */}
          <div className="bg-white border rounded-xl p-6 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-gray-800 border-b pb-3 flex items-center gap-2">
              <Layers className="w-4.5 h-4.5 text-primary" />
              About Us Page & Choosing Merits
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      About Us Section Header
                    </label>
                    <input
                      type="text"
                      value={cmsFields.aboutTitle}
                      onChange={(e) => setCmsFields(prev => ({ ...prev, aboutTitle: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Our Vision Header
                    </label>
                    <input
                      type="text"
                      value={cmsFields.aboutVisionTitle}
                      onChange={(e) => setCmsFields(prev => ({ ...prev, aboutVisionTitle: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    About Description text (Paragraph 1)
                  </label>
                  <textarea
                    rows={3}
                    value={cmsFields.aboutText1}
                    onChange={(e) => setCmsFields(prev => ({ ...prev, aboutText1: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    About Description text (Paragraph 2)
                  </label>
                  <textarea
                    rows={3}
                    value={cmsFields.aboutText2}
                    onChange={(e) => setCmsFields(prev => ({ ...prev, aboutText2: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Our Vision statement paragraph
                  </label>
                  <textarea
                    rows={3}
                    value={cmsFields.aboutVisionText}
                    onChange={(e) => setCmsFields(prev => ({ ...prev, aboutVisionText: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                    required
                  />
                </div>
              </div>

              {/* Image Upload Widget */}
              <div className="md:col-span-1 flex flex-col items-center justify-center border-l pl-0 md:pl-6">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  About Us Side Image
                </label>
                <div className="relative group w-40 h-40 border rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center">
                  {aboutPreview ? (
                    <img src={aboutPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-gray-300" />
                  )}
                  <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-all duration-200 cursor-pointer">
                    Change Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'about')}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Why Choose Us Cards */}
            <div className="border-t pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Merit section Main Title
                  </label>
                  <input
                    type="text"
                    value={cmsFields.chooseUsTitle}
                    onChange={(e) => setCmsFields(prev => ({ ...prev, chooseUsTitle: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Merit 1 */}
                <div className="bg-gray-50 p-4 rounded-xl border space-y-3">
                  <input
                    type="text"
                    value={cmsFields.chooseUsEfficiencyTitle}
                    onChange={(e) => setCmsFields(prev => ({ ...prev, chooseUsEfficiencyTitle: e.target.value }))}
                    placeholder="Merit 1 Title"
                    className="w-full px-2 py-1 bg-white border rounded text-xs font-bold focus:outline-none"
                    required
                  />
                  <textarea
                    rows={3}
                    value={cmsFields.chooseUsEfficiencyText}
                    onChange={(e) => setCmsFields(prev => ({ ...prev, chooseUsEfficiencyText: e.target.value }))}
                    placeholder="Merit 1 Description"
                    className="w-full px-2 py-1 bg-white border rounded text-xs focus:outline-none"
                    required
                  />
                </div>
                {/* Merit 2 */}
                <div className="bg-gray-50 p-4 rounded-xl border space-y-3">
                  <input
                    type="text"
                    value={cmsFields.chooseUsConvenienceTitle}
                    onChange={(e) => setCmsFields(prev => ({ ...prev, chooseUsConvenienceTitle: e.target.value }))}
                    placeholder="Merit 2 Title"
                    className="w-full px-2 py-1 bg-white border rounded text-xs font-bold focus:outline-none"
                    required
                  />
                  <textarea
                    rows={3}
                    value={cmsFields.chooseUsConvenienceText}
                    onChange={(e) => setCmsFields(prev => ({ ...prev, chooseUsConvenienceText: e.target.value }))}
                    placeholder="Merit 2 Description"
                    className="w-full px-2 py-1 bg-white border rounded text-xs focus:outline-none"
                    required
                  />
                </div>
                {/* Merit 3 */}
                <div className="bg-gray-50 p-4 rounded-xl border space-y-3">
                  <input
                    type="text"
                    value={cmsFields.chooseUsPersonalizationTitle}
                    onChange={(e) => setCmsFields(prev => ({ ...prev, chooseUsPersonalizationTitle: e.target.value }))}
                    placeholder="Merit 3 Title"
                    className="w-full px-2 py-1 bg-white border rounded text-xs font-bold focus:outline-none"
                    required
                  />
                  <textarea
                    rows={3}
                    value={cmsFields.chooseUsPersonalizationText}
                    onChange={(e) => setCmsFields(prev => ({ ...prev, chooseUsPersonalizationText: e.target.value }))}
                    placeholder="Merit 3 Description"
                    className="w-full px-2 py-1 bg-white border rounded text-xs focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Page CMS */}
          <div className="bg-white border rounded-xl p-6 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-gray-800 border-b pb-3 flex items-center gap-2">
              <Layers className="w-4.5 h-4.5 text-primary" />
              Contact Us page & Corporate Office details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Contact Title
                    </label>
                    <input
                      type="text"
                      value={cmsFields.contactTitle}
                      onChange={(e) => setCmsFields(prev => ({ ...prev, contactTitle: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Office Label
                    </label>
                    <input
                      type="text"
                      value={cmsFields.contactOfficeTitle}
                      onChange={(e) => setCmsFields(prev => ({ ...prev, contactOfficeTitle: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" /> Direct Telephone
                    </label>
                    <input
                      type="text"
                      value={cmsFields.contactPhone}
                      onChange={(e) => setCmsFields(prev => ({ ...prev, contactPhone: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" /> Support Email
                    </label>
                    <input
                      type="email"
                      value={cmsFields.contactEmail}
                      onChange={(e) => setCmsFields(prev => ({ ...prev, contactEmail: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> Physical Office Address
                  </label>
                  <textarea
                    rows={2}
                    value={cmsFields.contactAddress}
                    onChange={(e) => setCmsFields(prev => ({ ...prev, contactAddress: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                    required
                  />
                </div>

                {/* Career section */}
                <div className="bg-gray-50 p-4 rounded-xl border space-y-4">
                  <h4 className="text-xs font-bold text-gray-700 flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-primary" /> Career Opportunity card
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                        Career Section Title
                      </label>
                      <input
                        type="text"
                        value={cmsFields.contactCareerTitle}
                        onChange={(e) => setCmsFields(prev => ({ ...prev, contactCareerTitle: e.target.value }))}
                        className="w-full px-2 py-1.5 bg-white border rounded text-xs focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                        Explore Button label
                      </label>
                      <input
                        type="text"
                        value={cmsFields.contactExploreBtnText}
                        onChange={(e) => setCmsFields(prev => ({ ...prev, contactExploreBtnText: e.target.value }))}
                        className="w-full px-2 py-1.5 bg-white border rounded text-xs focus:outline-none"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      Career Pitch Description
                    </label>
                    <input
                      type="text"
                      value={cmsFields.contactCareerText}
                      onChange={(e) => setCmsFields(prev => ({ ...prev, contactCareerText: e.target.value }))}
                      className="w-full px-2 py-1.5 bg-white border rounded text-xs focus:outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Image Upload Widget */}
              <div className="md:col-span-1 flex flex-col items-center justify-center border-l pl-0 md:pl-6">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Contact Side Image
                </label>
                <div className="relative group w-40 h-40 border rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center">
                  {contactPreview ? (
                    <img src={contactPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-gray-300" />
                  )}
                  <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-all duration-200 cursor-pointer">
                    Change Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'contact')}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Action button */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isUpdatingCms}
              className="px-8 py-3 bg-primary text-white font-semibold text-sm rounded-lg shadow-md hover:bg-primary-dark transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isUpdatingCms ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Updating CMS Content...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save CMS Configuration
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ========================================================
          TAB 2: EMAIL TEMPLATE BUILDER
          ======================================================== */}
      {activeTab === 'emails' && (
        <div className="space-y-6">
          {/* Email Reminders Console */}
          <div className="bg-white border rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <Send className="w-4 h-4 text-primary" />
                  Appointment Reminders Dispatcher
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Scan the database and instantly send emails to doctors and patients for bookings due within 24 hours.
                </p>
              </div>
              <button
                type="button"
                onClick={handleTriggerReminders}
                disabled={isSendingReminders}
                className="px-5 py-2.5 bg-primary text-white font-semibold text-xs rounded-lg hover:bg-primary-dark transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
              >
                {isSendingReminders ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Sending Reminders...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Scan & Send Due Reminders
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Email Template Manager Card */}
          <div className="bg-white border rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" />
              Dynamic Email Templates Manager
            </h2>

            {isLoadingTemplates ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                <p className="text-xs text-gray-400">Loading email templates...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Template Picker */}
                <div className="md:col-span-1 border-r pr-0 md:pr-6 space-y-2 max-h-[60vh] overflow-y-auto">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Available Templates ({templates.length})
                  </p>
                  {templates.map((temp) => (
                    <button
                      key={temp.key}
                      type="button"
                      onClick={() => handleSelectTemplate(temp)}
                      className={`w-full p-3 border rounded-lg text-left cursor-pointer transition-all duration-150 flex flex-col gap-1 ${
                        selectedTemplate?.key === temp.key
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-gray-100 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`text-xs font-bold ${selectedTemplate?.key === temp.key ? 'text-primary' : 'text-gray-700'}`}>
                        {temp.name}
                      </span>
                      <span className="text-[10px] text-gray-400 line-clamp-2">
                        {temp.description || 'Custom Dynamic Template'}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Right Template Editor Form */}
                <div className="md:col-span-2 space-y-4">
                  {selectedTemplate ? (
                    <form onSubmit={handleSaveTemplate} className="space-y-4">
                      <div className="bg-gray-50 border p-4 rounded-xl">
                        <h4 className="text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-primary" />
                          Template Details: {selectedTemplate.name}
                        </h4>
                        <p className="text-[11px] text-gray-500 leading-relaxed">
                          {selectedTemplate.description}
                        </p>
                      </div>

                      {/* Subject */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                          Email Subject Line
                        </label>
                        <input
                          type="text"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="Subject"
                          className="w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                          required
                        />
                      </div>

                      {/* Body */}
                      <div>
                        <div className="flex items-center justify-between mb-3 border-b pb-2">
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Email Template Body
                          </label>
                          <div className="flex bg-gray-100 p-0.5 rounded-lg border">
                            <button
                              type="button"
                              onClick={() => setPreviewMode('edit')}
                              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                                previewMode === 'edit'
                                  ? 'bg-white text-primary shadow-sm'
                                  : 'text-gray-500 hover:text-gray-800'
                              }`}
                            >
                              Normal Text View (Source)
                            </button>
                            <button
                              type="button"
                              onClick={() => setPreviewMode('visual')}
                              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                                previewMode === 'visual'
                                  ? 'bg-white text-primary shadow-sm'
                                  : 'text-gray-500 hover:text-gray-800'
                              }`}
                            >
                              Visual HTML View (Preview)
                            </button>
                          </div>
                        </div>

                        {previewMode === 'edit' ? (
                          <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="HTML template body text..."
                            className="w-full h-96 px-3 py-2.5 border rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed resize-y bg-gray-50"
                            required
                          />
                        ) : (
                          <div className="border rounded-lg bg-gray-100 p-3 shadow-inner">
                            <iframe
                              srcDoc={getCompiledPreview(body)}
                              className="w-full h-96 border rounded-md bg-white shadow-sm"
                              sandbox="allow-same-origin"
                              title="Email Template Render Preview"
                            />
                          </div>
                        )}
                      </div>

                      {/* Helper Variables Badge List */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
                          Placeholders allowed in this template (Copy/Paste):
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedTemplate.variables && selectedTemplate.variables.length > 0 ? (
                            selectedTemplate.variables.map((v) => (
                              <button
                                key={v}
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(`{{${v}}}`);
                                  toast.info(`Copied {{${v}}} to clipboard!`);
                                }}
                                className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-mono text-[10px] rounded border cursor-pointer select-none transition-colors"
                                title="Click to copy placeholder"
                              >
                                {`{{${v}}}`}
                              </button>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400 italic">No custom variables required</span>
                          )}
                        </div>
                      </div>

                      {/* Save Button */}
                      <div className="pt-2 border-t flex justify-end">
                        <button
                          type="submit"
                          disabled={isSavingTemplate}
                          className="px-6 py-2.5 bg-primary text-white font-semibold rounded-lg text-xs shadow hover:bg-primary-dark transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {isSavingTemplate ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Saving Template...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              Save Email Template
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="text-center py-20 text-gray-400 text-xs">
                      Please select an email template from the list to start editing.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: DIRECT MASS / BULK BROADCASTER
          ======================================================== */}
      {activeTab === 'broadcast' && (
        <form onSubmit={handleBroadcast} className="space-y-6 max-w-4xl">
          <div className="bg-white border rounded-xl p-6 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-gray-800 border-b pb-3 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-primary" />
              Direct Message Broadcaster Console
            </h3>

            {/* Recipient Selection Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 space-y-4">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                  1. Recipient Scope
                </label>
                <div className="flex flex-col gap-2">
                  {[
                    { value: 'all-patients', label: 'All Patients', desc: 'Broadcast to all patients' },
                    { value: 'all-doctors', label: 'All Doctors', desc: 'Broadcast to all doctors' },
                    { value: 'selected-users', label: 'Select Specific Users', desc: 'Pick target professionals or users' },
                    { value: 'custom-emails', label: 'Custom List', desc: 'Enter custom comma-separated list' }
                  ].map((scope) => (
                    <button
                      key={scope.value}
                      type="button"
                      onClick={() => {
                        setRecipientType(scope.value as any);
                        setSelectedEmails([]);
                      }}
                      className={`p-3 border rounded-lg text-left cursor-pointer transition-all duration-150 flex flex-col justify-between ${
                        recipientType === scope.value
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`text-xs font-bold ${recipientType === scope.value ? 'text-primary' : 'text-gray-700'}`}>
                        {scope.label}
                      </span>
                      <span className="text-[9px] text-gray-400 mt-0.5">{scope.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Scope specific configuration list */}
              <div className="md:col-span-2 border-l pl-0 md:pl-6 space-y-4">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                  2. Recipient Selection Coordinates
                </label>

                {recipientType === 'all-patients' && (
                  <div className="p-4 bg-gray-50 rounded-xl text-xs text-gray-600 border border-dashed flex items-center gap-2">
                    <Users className="w-5 h-5 text-gray-400" />
                    Targeting <strong>{patients?.length || 0} registered patients</strong> on Medics-Online.
                  </div>
                )}

                {recipientType === 'all-doctors' && (
                  <div className="p-4 bg-gray-50 rounded-xl text-xs text-gray-600 border border-dashed flex items-center gap-2">
                    <Users className="w-5 h-5 text-gray-400" />
                    Targeting <strong>{doctors?.length || 0} registered medical doctors</strong>.
                  </div>
                )}

                {recipientType === 'custom-emails' && (
                  <div className="space-y-2">
                    <label className="block text-[11px] text-gray-400 leading-normal">
                      Input target email coordinates separated by comma (e.g. <code>info@example.com, doctor@hospital.com</code>)
                    </label>
                    <textarea
                      rows={3}
                      value={customEmails}
                      onChange={(e) => setCustomEmails(e.target.value)}
                      placeholder="support@medicsonline.ng, manager@office.com"
                      className="w-full px-3 py-2 border rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed resize-none"
                      required
                    />
                  </div>
                )}

                {recipientType === 'selected-users' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-gray-400">
                        Pick individual doctor or patient targets: ({selectedEmails.length} selected)
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedEmails([])}
                        className="text-[10px] text-primary hover:underline"
                      >
                        Clear Selection
                      </button>
                    </div>
                    <div className="border rounded-lg max-h-[160px] overflow-y-auto divide-y bg-white text-xs">
                      {/* Doctors */}
                      {doctors && doctors.length > 0 && (
                        <div className="p-2 bg-gray-50 font-semibold text-[10px] text-gray-500 uppercase tracking-wider">
                          👨‍⚕️ Doctors
                        </div>
                      )}
                      {doctors?.map((doc: any) => (
                        <label
                          key={`doc-${doc._id}`}
                          className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedEmails.includes(doc.email)}
                            onChange={() => handleSelectedEmailsChange(doc.email)}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <div>
                            <p className="font-semibold text-gray-700">{doc.name}</p>
                            <p className="text-[10px] text-gray-400 font-mono">{doc.email} ({doc.speciality})</p>
                          </div>
                        </label>
                      ))}

                      {/* Patients */}
                      {patients && patients.length > 0 && (
                        <div className="p-2 bg-gray-50 font-semibold text-[10px] text-gray-500 uppercase tracking-wider">
                          👤 Patients
                        </div>
                      )}
                      {patients?.map((pat: any) => (
                        <label
                          key={`pat-${pat._id}`}
                          className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedEmails.includes(pat.email)}
                            onChange={() => handleSelectedEmailsChange(pat.email)}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <div>
                            <p className="font-semibold text-gray-700">{pat.name}</p>
                            <p className="text-[10px] text-gray-400 font-mono">{pat.email}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Email Title & Rich text area */}
            <div className="border-t pt-6 space-y-4">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                3. Operational Message details
              </label>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Email Subject Line
                </label>
                <input
                  type="text"
                  value={broadcastSubject}
                  onChange={(e) => setBroadcastSubject(e.target.value)}
                  placeholder="e.g. Critical Update: Scheduled Maintenances this Sunday"
                  className="w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Mail HTML Body (Branded Premium template layout wrapper applied automatically)
                </label>
                <textarea
                  rows={8}
                  value={broadcastBody}
                  onChange={(e) => setBroadcastBody(e.target.value)}
                  placeholder="<p>Dear Valued User,</p><p>We are rolling out new consult slots this weekend...</p>"
                  className="w-full px-3 py-2.5 border rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed resize-y"
                  required
                />
              </div>
            </div>
          </div>

          {/* Broadcast submission */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isBroadcasting}
              className="px-8 py-3 bg-primary text-white font-semibold text-sm rounded-lg shadow-md hover:bg-primary-dark transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isBroadcasting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Broadcasting Emails via SMTP...
                </>
              ) : (
                <>
                  <Megaphone className="w-4 h-4" />
                  Broadcast Mass Mailer
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ========================================================
          TAB 4: SYSTEM MAINTENANCE (PURGING CARD)
          ======================================================== */}
      {activeTab === 'maintenance' && (
        <div className="max-w-3xl">
          {/* Warning Card */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6 flex items-start gap-4">
            <AlertTriangle className="w-10 h-10 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-amber-800">Irreversible Action Warning</h3>
              <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                Clearing collections will permanently purge records from the database. 
                Clearing doctors or patients will also remove their associated appointments automatically to maintain system-wide database integrity. 
                Please use this utility with extreme caution.
              </p>
            </div>
          </div>

          {/* Main Settings Card */}
          <div className="bg-white border rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-500" />
              Clear Site Collections
            </h2>

            <form onSubmit={handleClearData} className="space-y-6">
              {/* Target Select */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Select Data Collection to Clear
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'appointments', label: 'Bookings', desc: 'Clear all appointments' },
                    { value: 'doctors', label: 'Doctors', desc: 'Clear all doctors & payouts' },
                    { value: 'patients', label: 'Patients', desc: 'Clear all patients & accounts' }
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setTarget(item.value as any)}
                      className={`p-4 border rounded-xl text-left cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                        target === item.value
                          ? 'border-red-500 bg-red-50/20 ring-1 ring-red-500'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`text-sm font-bold ${target === item.value ? 'text-red-600' : 'text-gray-700'}`}>
                        {item.label}
                      </span>
                      <span className="text-[10px] text-gray-400 mt-1">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Warning Note */}
              <div className="text-xs text-gray-500 leading-relaxed bg-gray-50 p-3 rounded-lg border">
                {target === 'appointments' && (
                  <span>💡 <strong>Bookings</strong> target clears only appointment documents. Doctors and patients accounts remain intact.</span>
                )}
                {target === 'doctors' && (
                  <span>💡 <strong>Doctors</strong> target clears all registered doctors, bank coordinates, payout requests, and all their scheduled appointments.</span>
                )}
                {target === 'patients' && (
                  <span>💡 <strong>Patients</strong> target clears all registered patient/user accounts, along with all their scheduled appointments.</span>
                )}
              </div>

              {/* Confirm Field */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  To confirm, type <span className="font-bold text-red-600">CLEAR</span> below
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type CLEAR to authorize"
                  className="w-full max-w-md px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-red-500 font-bold"
                  required
                />
              </div>

              {/* Submit Action */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isClearing || confirmText !== 'CLEAR'}
                  className={`px-6 py-2.5 bg-red-600 text-white font-semibold rounded-lg shadow hover:bg-red-700 transition-colors flex items-center gap-2 cursor-pointer text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isClearing ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                      Purging Data...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Purge Selected Data
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ========================================================
          TAB 5: DYNAMIC ADMIN ROLES & ACCESS CONTROL (RBAC)
          ======================================================== */}
      {activeTab === 'roles' && adminProfile?.role === 'master' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-primary/10 to-blue-500/10 border border-primary/20 rounded-xl p-5 mb-6 flex items-start gap-4">
            <Shield className="w-10 h-10 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-gray-800">Granular Role-Based Access Control Panel</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                As the Master Administrator, you have absolute authority to enroll additional system administrators, restrict access permissions on standard directories, or suspend active staff accounts instantly.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Enrollment Form Column */}
            <div className="lg:col-span-1 bg-white border rounded-xl p-6 shadow-sm h-fit">
              <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                <Users className="w-4 h-4 text-primary" />
                Enroll Staff Admin
              </h2>

              <form onSubmit={handleEnrollAdmin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={newAdminName}
                    onChange={(e) => setNewAdminName(e.target.value)}
                    placeholder="E.g. Dr. Manuel"
                    className="w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="staff@medicsonline.com"
                    className="w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Access Password
                  </label>
                  <input
                    type="password"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>

                {/* Default Access Matrix */}
                <div className="border-t pt-3">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Grant Dashboard Scopes
                  </label>
                  <div className="space-y-2">
                    {Object.keys(newAdminPermissions).map((scope: string) => (
                      <label key={scope} className="flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer border border-gray-100">
                        <span className="text-xs font-medium text-gray-600 capitalize">
                          {scope} module
                        </span>
                        <input
                          type="checkbox"
                          checked={newAdminPermissions[scope]}
                          onChange={(e) => {
                            setNewAdminPermissions({
                              ...newAdminPermissions,
                              [scope]: e.target.checked
                            });
                          }}
                          className="w-3.5 h-3.5 rounded text-primary focus:ring-primary"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isCreatingAdmin}
                  className="w-full py-2.5 bg-primary text-white font-semibold rounded-lg text-xs shadow hover:bg-primary-dark transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isCreatingAdmin ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Enrolling Account...
                    </>
                  ) : (
                    <>
                      <Shield className="w-3.5 h-3.5" />
                      Enroll Staff Administrator
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* List Column */}
            <div className="lg:col-span-2 bg-white border rounded-xl p-6 shadow-sm">
              <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                <Shield className="w-4 h-4 text-primary" />
                Active Administrative Staff Accounts ({admins.length})
              </h2>

              {admins.length === 0 ? (
                <div className="text-center py-20 text-xs text-gray-400">
                  No additional administrative accounts are currently registered.
                </div>
              ) : (
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                  {admins.map((adm: any) => (
                    <div key={adm._id} className="border rounded-xl p-4 hover:border-primary/40 transition-colors bg-gray-50/50">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-xs font-bold text-gray-800">{adm.name}</h3>
                            <span className="text-[9px] text-gray-400">({adm.email})</span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              adm.role === 'master' 
                                ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                                : 'bg-blue-100 text-blue-700 border border-blue-200'
                            }`}>
                              {adm.role.toUpperCase()}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              adm.isActive 
                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                                : 'bg-red-100 text-red-700 border border-red-200'
                            }`}>
                              {adm.isActive ? 'ACTIVE' : 'SUSPENDED'}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-1">
                            Registered on: {adm.createdAt ? new Date(adm.createdAt).toLocaleString() : 'N/A'}
                          </p>
                        </div>

                        {/* Actions (disallow self or master admin modifications) */}
                        {adm.role !== 'master' && (
                          <div className="flex items-center gap-2">
                            {/* Toggle active state */}
                            <button
                              type="button"
                              onClick={() => updateAdminStaff(adm._id, adm.permissions, !adm.isActive)}
                              className={`px-2 py-1 text-[9px] font-bold rounded border cursor-pointer transition-colors ${
                                adm.isActive 
                                  ? 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200' 
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-200'
                              }`}
                            >
                              {adm.isActive ? 'Suspend' : 'Activate'}
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Are you absolutely sure you want to delete ${adm.name}?`)) {
                                  deleteAdminStaff(adm._id);
                                }
                              }}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded border border-gray-150 cursor-pointer"
                              title="Remove account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Interactive Scopes */}
                      <div className="mt-3 border-t pt-3">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                          Interactive Permissions (Click checkbox to edit instantly):
                        </p>
                        <div className="flex flex-wrap gap-3">
                          {Object.keys(adm.permissions || {}).map((scope: string) => (
                            <label
                              key={scope}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-medium transition-all ${
                                adm.permissions[scope]
                                  ? 'bg-primary/5 text-primary border-primary/30'
                                  : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'
                              } ${adm.role === 'master' ? 'opacity-70 pointer-events-none' : 'cursor-pointer'}`}
                            >
                              <input
                                type="checkbox"
                                checked={adm.permissions[scope]}
                                disabled={adm.role === 'master'}
                                onChange={(e) => {
                                  const updatedPerms = { ...adm.permissions, [scope]: e.target.checked };
                                  updateAdminStaff(adm._id, updatedPerms, adm.isActive);
                                }}
                                className="w-3 h-3 text-primary border-gray-300 rounded focus:ring-primary pointer-events-none"
                              />
                              <span className="capitalize">{scope}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      [ignoring loop detection]
    </div>
  );
};

export default AdminSettings;

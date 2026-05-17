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
  RefreshCw 
} from 'lucide-react';

import { AdminContext } from '@/context/AdminContext';
import type { IAdminContext, IEmailTemplate } from '@/models/doctor';
import { smartApi } from '@/utils/smartApi';

const AdminSettings = () => {
  const { 
    aToken, 
    getEmailTemplates, 
    updateEmailTemplate, 
    sendAppointmentReminders 
  } = useContext(AdminContext) as IAdminContext;

  const [activeTab, setActiveTab] = useState<'maintenance' | 'emails'>('maintenance');

  // Maintenance States
  const [target, setTarget] = useState<'doctors' | 'appointments' | 'patients'>('appointments');
  const [confirmText, setConfirmText] = useState('');
  const [isClearing, setIsClearing] = useState(false);

  // Email States
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
        // Refresh local lists
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

  return (
    <div className="m-5 w-full max-w-5xl">
      <div className="flex items-center gap-2 mb-1">
        <Settings className="w-6 h-6 text-primary" />
        <h1 className="text-xl font-bold text-gray-800">System settings & maintains</h1>
      </div>
      <p className="text-xs text-gray-500 mb-6">
        Configure dynamic email notifications, edit mail templates, and manage database collections.
      </p>

      {/* Tab Switcher */}
      <div className="flex border-b mb-6 gap-6">
        <button
          onClick={() => setActiveTab('maintenance')}
          className={`pb-3 font-semibold text-sm transition-all duration-200 relative cursor-pointer ${
            activeTab === 'maintenance' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          System Maintenance
          {activeTab === 'maintenance' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full" />}
        </button>
        <button
          onClick={() => setActiveTab('emails')}
          className={`pb-3 font-semibold text-sm transition-all duration-200 relative cursor-pointer ${
            activeTab === 'emails' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Email & Notifications Manager
          {activeTab === 'emails' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full" />}
        </button>
      </div>

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
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Email HTML Body
                          </label>
                          <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-mono">
                            Supports HTML tags
                          </span>
                        </div>
                        <textarea
                          value={body}
                          onChange={(e) => setBody(e.target.value)}
                          placeholder="HTML template body text..."
                          className="w-full h-80 px-3 py-2.5 border rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed resize-y"
                          required
                        />
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
                                  // Quick copy placeholder to clipboard
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
    </div>
  );
};

export default AdminSettings;

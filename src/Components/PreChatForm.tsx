import { useState } from 'react';
import type { PreChatFormData, IssueType, Language } from '../types/chat';

interface PreChatFormProps {
  onSubmit: (data: PreChatFormData) => void;
}

const ISSUE_OPTIONS: { value: IssueType; label: string; icon: string }[] = [
  { value: 'claim_status', label: 'Check Claim Status', icon: '📋' },
  { value: 'policy_info', label: 'Policy Information', icon: '🛡️' },
  { value: 'billing', label: 'Billing & Payments', icon: '💳' },
  { value: 'general', label: 'General Inquiry', icon: '💬' },
];

const inputClass = 'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-[14px] text-gray-800 outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand-100 font-sans bg-white';

const PreChatForm = ({ onSubmit }: PreChatFormProps) => {
  const [form, setForm] = useState<PreChatFormData>({ customerName: '', policyNumber: '', issueType: 'general', language: 'en' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.customerName.trim() && form.policyNumber.trim()) onSubmit(form);
  };

  return (
    <div className="p-5 bg-gray-50/50">
      <h3 className="text-[16px] font-bold text-gray-900 mb-1">How can we help?</h3>
      <p className="text-[13px] text-gray-400 mb-5">Enter your details to connect with support.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <div>
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
            Full Name <span className="text-red-400">*</span>
          </label>
          <input
            className={inputClass}
            type="text"
            required
            placeholder="e.g. Jane Smith"
            value={form.customerName}
            onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
            Policy Number <span className="text-red-400">*</span>
          </label>
          <input
            className={inputClass}
            type="text"
            required
            placeholder="e.g. KI-123456"
            value={form.policyNumber}
            onChange={(e) => setForm((f) => ({ ...f, policyNumber: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Topic</label>
          <select
            className={`${inputClass} bg-white`}
            value={form.issueType}
            onChange={(e) => setForm((f) => ({ ...f, issueType: e.target.value as IssueType }))}
          >
            {ISSUE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.icon} {o.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Language</label>
          <div className="grid grid-cols-2 gap-2">
            {([['en', '🇺🇸', 'English'], ['es', '🇪🇸', 'Español']] as [Language, string, string][]).map(([val, flag, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setForm((f) => ({ ...f, language: val }))}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[13px] font-semibold transition-all ${
                  form.language === val
                    ? 'border-brand bg-brand-50 text-brand ring-2 ring-brand-100'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-brand-200 hover:text-brand'
                }`}
              >
                <span className="text-[16px]">{flag}</span>
                {label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-brand-gradient text-white text-[14px] font-bold py-3.5 rounded-xl border-none mt-1 transition-all shadow-btn hover:shadow-btn-lg hover:-translate-y-px active:translate-y-0"
        >
          Start Chat →
        </button>

        <p className="text-[11px] text-gray-400 text-center -mt-1">
          By chatting you agree to our Privacy Policy.
        </p>
      </form>
    </div>
  );
};

export default PreChatForm;

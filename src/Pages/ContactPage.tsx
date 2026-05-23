import { useState } from 'react';
import { portalApi } from '../services/portalApi';

type FormState = 'idle' | 'submitting' | 'success' | 'error';

const SUBJECTS = ['Billing Query', 'Claim Issue', 'Policy Question', 'Technical Support', 'Other'];

const inputClass =
  'w-full border border-gray-200 rounded-xl px-4 py-3 text-[14px] text-gray-800 outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand-100 font-sans bg-white';

const ContactPage = () => {
  const [form, setForm] = useState({
    customerName: '',
    email: '',
    phone: '',
    policyNumber: '',
    subject: 'Policy Question',
    message: '',
  });
  const [status, setStatus] = useState<FormState>('idle');
  const [error, setError] = useState('');
  const [contactId, setContactId] = useState('');

  const set = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setError('');
    try {
      const res = await portalApi.submitContact({
        customerName: form.customerName,
        email: form.email,
        message: form.message,
        phone: form.phone || undefined,
        policyNumber: form.policyNumber || undefined,
        subject: form.subject,
      });
      setContactId(res.contactId);
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <section className="min-h-[70vh] flex items-center justify-center py-20 px-6 bg-hero-gradient">
        <div className="bg-white rounded-2xl shadow-card border border-border p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center text-3xl mx-auto mb-5">
            📬
          </div>
          <h2 className="text-[24px] font-extrabold text-gray-900 mb-2">Message Sent!</h2>
          <p className="text-[14px] text-gray-500 mb-4">
            We've received your enquiry and will respond to{' '}
            <span className="font-semibold text-gray-700">{form.email}</span> within 24 hours.
          </p>
          <p className="text-[12px] text-gray-400 bg-gray-50 rounded-xl px-4 py-2 font-mono">
            Reference ID: {contactId}
          </p>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => { setStatus('idle'); setForm({ customerName: '', email: '', phone: '', policyNumber: '', subject: 'Policy Question', message: '' }); }}
              className="flex-1 bg-brand text-white font-semibold text-[14px] py-3 rounded-xl border-none hover:bg-brand-dark transition"
            >
              New Enquiry
            </button>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('kiro:open-chat'))}
              className="flex-1 bg-gray-100 text-gray-700 font-semibold text-[14px] py-3 rounded-xl border-none hover:bg-gray-200 transition"
            >
              Live Chat
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[70vh] py-20 px-6 bg-hero-gradient relative overflow-hidden">
      <div className="absolute -top-24 -left-24 w-[400px] h-[400px] rounded-full bg-brand-100 opacity-40 blur-3xl pointer-events-none" />
      <div className="relative max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-brand-gradient flex items-center justify-center text-[28px] mb-5 mx-auto shadow-btn-lg">
            ✉️
          </div>
          <p className="text-brand text-[12px] font-bold tracking-[2px] uppercase mb-2">Contact Us</p>
          <h1 className="text-[32px] font-extrabold text-gray-900 tracking-tight leading-tight mb-3">
            Send Us a Message
          </h1>
          <p className="text-[15px] text-gray-500">
            Have a question? Fill out the form and we'll get back to you within 24 hours.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-border p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  className={inputClass}
                  type="text"
                  required
                  placeholder="Jane Smith"
                  value={form.customerName}
                  onChange={(e) => set('customerName', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Email Address <span className="text-red-400">*</span>
                </label>
                <input
                  className={inputClass}
                  type="email"
                  required
                  placeholder="jane@example.com"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Phone <span className="text-gray-400 normal-case font-normal">(optional)</span>
                </label>
                <input
                  className={inputClass}
                  type="tel"
                  placeholder="+12125550100"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Policy Number <span className="text-gray-400 normal-case font-normal">(optional)</span>
                </label>
                <input
                  className={inputClass}
                  type="text"
                  placeholder="POL-12345"
                  value={form.policyNumber}
                  onChange={(e) => set('policyNumber', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Subject</label>
              <div className="flex flex-wrap gap-2">
                {SUBJECTS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set('subject', s)}
                    className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold border transition-all ${
                      form.subject === s
                        ? 'border-brand bg-brand-50 text-brand ring-2 ring-brand-100'
                        : 'border-gray-200 bg-white text-gray-500 hover:border-brand-200 hover:text-brand'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Message <span className="text-red-400">*</span>
              </label>
              <textarea
                className={`${inputClass} resize-none`}
                required
                rows={5}
                placeholder="Describe your question or issue in detail…"
                value={form.message}
                onChange={(e) => set('message', e.target.value)}
              />
            </div>

            {status === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-[13px] text-red-600">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={status === 'submitting'}
                className="flex-1 bg-brand-gradient text-white text-[15px] font-bold py-3.5 rounded-xl border-none transition-all shadow-btn hover:shadow-btn-lg hover:-translate-y-px active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
              >
                {status === 'submitting' ? 'Sending…' : 'Send Message →'}
              </button>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('kiro:open-chat'))}
                className="px-5 bg-gray-100 text-gray-600 text-[14px] font-semibold rounded-xl border-none hover:bg-gray-200 transition"
              >
                💬 Chat
              </button>
            </div>

            <p className="text-[11px] text-gray-400 text-center -mt-1">
              We respond within 24 hours · Your data is kept secure
            </p>
          </form>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          {[
            { icon: '💬', title: 'Live Chat', desc: 'Get instant help from Kira AI or a live agent', action: 'Open Chat', onClick: () => window.dispatchEvent(new CustomEvent('kiro:open-chat')) },
            { icon: '📞', title: 'Callback', desc: 'Request a call from a specialist', action: 'Schedule Call', href: '/callback' },
            { icon: '⏱️', title: 'Response Time', desc: 'Email replies within 24 hours', action: null },
          ].map((card) => (
            <div key={card.title} className="bg-white border border-border rounded-2xl p-5 text-center shadow-card">
              <div className="text-2xl mb-2">{card.icon}</div>
              <div className="text-[13px] font-bold text-gray-800 mb-1">{card.title}</div>
              <div className="text-[12px] text-gray-400 mb-3">{card.desc}</div>
              {card.action && (
                card.href
                  ? <a href={card.href} className="text-[12px] font-semibold text-brand hover:underline">{card.action} →</a>
                  : <button onClick={card.onClick} className="text-[12px] font-semibold text-brand bg-transparent border-none cursor-pointer hover:underline">{card.action} →</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ContactPage;

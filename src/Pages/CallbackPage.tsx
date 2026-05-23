import { useState } from 'react';
import { portalApi } from '../services/portalApi';

type FormState = 'idle' | 'submitting' | 'success' | 'error';

const TOPICS = ['Claims', 'Billing', 'Policy', 'General'];

const inputClass =
  'w-full border border-gray-200 rounded-xl px-4 py-3 text-[14px] text-gray-800 outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand-100 font-sans bg-white';

const CallbackPage = () => {
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    policyNumber: '',
    topic: 'General',
  });
  const [status, setStatus] = useState<FormState>('idle');
  const [error, setError] = useState('');
  const [callbackId, setCallbackId] = useState('');

  const set = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setError('');
    try {
      const res = await portalApi.requestCallback({
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        policyNumber: form.policyNumber || undefined,
        topic: form.topic,
      });
      setCallbackId(res.callbackId);
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
            ✅
          </div>
          <h2 className="text-[24px] font-extrabold text-gray-900 mb-2">Callback Scheduled!</h2>
          <p className="text-[14px] text-gray-500 mb-4">
            We'll call you back at <span className="font-semibold text-gray-700">{form.customerPhone}</span> shortly.
          </p>
          <p className="text-[12px] text-gray-400 bg-gray-50 rounded-xl px-4 py-2 font-mono">
            Reference ID: {callbackId}
          </p>
          <button
            onClick={() => { setStatus('idle'); setForm({ customerName: '', customerPhone: '', policyNumber: '', topic: 'General' }); }}
            className="mt-6 w-full bg-brand text-white font-semibold text-[14px] py-3 rounded-xl border-none hover:bg-brand-dark transition"
          >
            Request Another Callback
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[70vh] flex items-center justify-center py-20 px-6 bg-hero-gradient relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-[400px] h-[400px] rounded-full bg-brand-100 opacity-40 blur-3xl pointer-events-none" />
      <div className="relative w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-brand-gradient flex items-center justify-center text-[28px] mb-5 mx-auto shadow-btn-lg">
            📞
          </div>
          <p className="text-brand text-[12px] font-bold tracking-[2px] uppercase mb-2">Request a Callback</p>
          <h1 className="text-[32px] font-extrabold text-gray-900 tracking-tight leading-tight mb-3">
            We'll Call You Back
          </h1>
          <p className="text-[15px] text-gray-500">
            Leave your number and a specialist will reach out within minutes.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-border p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
                onChange={(e) => set('customerName', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Phone Number <span className="text-red-400">*</span>
              </label>
              <input
                className={inputClass}
                type="tel"
                required
                placeholder="+1 (212) 555-0100"
                value={form.customerPhone}
                onChange={(e) => set('customerPhone', e.target.value)}
              />
              <p className="text-[11px] text-gray-400 mt-1">Include country code, e.g. +12125550100</p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Policy Number <span className="text-gray-400 normal-case font-normal">(optional)</span>
              </label>
              <input
                className={inputClass}
                type="text"
                placeholder="e.g. POL-12345"
                value={form.policyNumber}
                onChange={(e) => set('policyNumber', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Topic</label>
              <div className="grid grid-cols-2 gap-2">
                {TOPICS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set('topic', t)}
                    className={`py-2.5 rounded-xl border text-[13px] font-semibold transition-all ${
                      form.topic === t
                        ? 'border-brand bg-brand-50 text-brand ring-2 ring-brand-100'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-brand-200 hover:text-brand'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {status === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-[13px] text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="w-full bg-brand-gradient text-white text-[15px] font-bold py-3.5 rounded-xl border-none transition-all shadow-btn hover:shadow-btn-lg hover:-translate-y-px active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
            >
              {status === 'submitting' ? 'Scheduling…' : 'Request Callback →'}
            </button>

            <p className="text-[11px] text-gray-400 text-center">
              Average callback time: under 5 minutes · Available 24/7
            </p>
          </form>
        </div>
      </div>
    </section>
  );
};

export default CallbackPage;

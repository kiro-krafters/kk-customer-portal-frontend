const STEPS = [
  {
    number: '01',
    icon: '💬',
    title: 'Click "Get Support"',
    description: 'Hit the chat button or the Get Support link in the nav. Works on any device, any time.',
  },
  {
    number: '02',
    icon: '📋',
    title: 'Enter Your Details',
    description: 'Provide your name and policy number so we can instantly pull up your account.',
  },
  {
    number: '03',
    icon: '⚡',
    title: 'Get Help Instantly',
    description: "Our AI answers common questions in seconds. A live agent is always one click away.",
  },
];

const HowItWorks = () => (
  <section className="bg-surface py-24 px-6 lg:px-10 relative overflow-hidden">
    {/* Decorative background */}
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-[800px] bg-brand-gradient opacity-[0.03] rounded-full blur-3xl pointer-events-none" />

    <div className="relative max-w-[1280px] mx-auto">
      {/* Section header */}
      <div className="text-center max-w-[520px] mx-auto mb-16">
        <p className="text-brand text-[12px] font-bold tracking-[2px] uppercase mb-3">Simple Process</p>
        <h2 className="text-[36px] font-extrabold text-gray-900 tracking-tight leading-[1.15] mb-4">
          Up and running in{' '}
          <span className="text-gradient">3 simple steps</span>
        </h2>
        <p className="text-gray-500 text-[16px] leading-[1.7]">
          No complicated forms. No hold music. Just fast, intelligent support whenever you need it.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
        {/* Connector line */}
        <div className="hidden md:block absolute top-[52px] left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-px bg-gradient-to-r from-border via-brand-200 to-border" />

        {STEPS.map((step, i) => (
          <div key={step.number} className="relative flex flex-col items-center text-center">
            {/* Step circle */}
            <div className="relative mb-6">
              <div className={`w-[104px] h-[104px] rounded-2xl flex flex-col items-center justify-center shadow-card-hover transition-transform hover:-translate-y-1 ${
                i === 1 ? 'bg-brand-gradient' : 'bg-white border border-border'
              }`}>
                <span className="text-[28px] mb-1">{step.icon}</span>
                <span className={`text-[11px] font-bold tracking-wide ${i === 1 ? 'text-white/70' : 'text-gray-400'}`}>
                  STEP {step.number}
                </span>
              </div>
              {/* Number badge */}
              <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full text-[11px] font-extrabold flex items-center justify-center border-2 border-white shadow-sm ${
                i === 1 ? 'bg-brand text-white' : 'bg-gray-900 text-white'
              }`}>
                {i + 1}
              </div>
            </div>

            <h3 className="text-[16px] font-bold text-gray-900 mb-2">{step.title}</h3>
            <p className="text-[14px] text-gray-500 leading-relaxed max-w-[220px]">{step.description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorks;

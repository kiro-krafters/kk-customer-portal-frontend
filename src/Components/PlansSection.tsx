const PLANS = [
  {
    name: 'Basic Shield',
    price: '$49',
    per: '/mo',
    desc: 'Essential coverage for individuals',
    featured: false,
    badge: null,
    features: [
      'Medical coverage up to $100K',
      'Accident coverage',
      'Chat support',
      '24/7 AI assistant',
      'Mobile app access',
    ],
  },
  {
    name: 'Premium Guard',
    price: '$129',
    per: '/mo',
    desc: 'Complete protection for families',
    featured: true,
    badge: 'Most Popular',
    features: [
      'Medical coverage up to $500K',
      'Accident + theft coverage',
      'Priority voice & chat support',
      'Dedicated agent',
      'Contact Lens analytics',
      'Multilingual support',
    ],
  },
  {
    name: 'Elite Fortress',
    price: '$249',
    per: '/mo',
    desc: 'Ultimate coverage for businesses',
    featured: false,
    badge: null,
    features: [
      'Unlimited medical coverage',
      'All-risk coverage',
      'VIP call line',
      'Personal account manager',
      'Real-time dashboard',
      'Custom call routing',
    ],
  },
];

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0 mt-0.5">
    <circle cx="7" cy="7" r="7" fill="#dcfce7"/>
    <path d="M4.5 7l2 2 3-3" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PlansSection = () => (
  <section className="bg-white py-24 px-6 lg:px-10">
    <div className="max-w-[1280px] mx-auto">
      {/* Section header */}
      <div className="text-center max-w-[520px] mx-auto mb-14">
        <p className="text-brand text-[12px] font-bold tracking-[2px] uppercase mb-3">Coverage Plans</p>
        <h2 className="text-[36px] font-extrabold text-gray-900 tracking-tight leading-[1.15] mb-4">
          Choose your{' '}
          <span className="text-gradient">protection level</span>
        </h2>
        <p className="text-gray-500 text-[16px] leading-[1.7]">
          Transparent pricing, comprehensive coverage. Upgrade, downgrade, or cancel anytime.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {PLANS.map((p) => (
          <div
            key={p.name}
            className={`relative rounded-2xl p-8 transition-all duration-200 ${
              p.featured
                ? 'bg-brand-gradient text-white shadow-btn-lg scale-[1.02]'
                : 'bg-white border border-border shadow-card hover:shadow-card-hover hover:-translate-y-0.5'
            }`}
          >
            {p.badge && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-white text-brand text-[11px] font-bold px-4 py-1 rounded-full shadow-card border border-brand-200 uppercase tracking-wide">
                {p.badge}
              </div>
            )}

            {/* Plan name */}
            <div className={`text-[13px] font-bold uppercase tracking-widest mb-3 ${p.featured ? 'text-blue-200' : 'text-gray-400'}`}>
              {p.name}
            </div>

            {/* Price */}
            <div className="flex items-end gap-1 mb-2">
              <span className={`text-[42px] font-extrabold leading-none ${p.featured ? 'text-white' : 'text-gray-900'}`}>
                {p.price}
              </span>
              <span className={`text-[14px] font-medium mb-1.5 ${p.featured ? 'text-blue-200' : 'text-gray-400'}`}>
                {p.per}
              </span>
            </div>
            <p className={`text-[13px] mb-6 pb-6 border-b ${p.featured ? 'text-blue-200 border-white/20' : 'text-gray-400 border-border'}`}>
              {p.desc}
            </p>

            {/* Features */}
            <ul className="flex flex-col gap-3 mb-8">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[13px]">
                  {p.featured
                    ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0 mt-0.5">
                        <circle cx="7" cy="7" r="7" fill="rgba(255,255,255,0.2)"/>
                        <path d="M4.5 7l2 2 3-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    : <CheckIcon />
                  }
                  <span className={p.featured ? 'text-blue-100' : 'text-gray-600'}>{f}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => window.dispatchEvent(new CustomEvent('kiro:open-chat'))}
              className={`w-full py-3.5 rounded-xl text-[14px] font-bold border-none transition-all ${
                p.featured
                  ? 'bg-white text-brand hover:bg-blue-50 shadow-btn'
                  : 'bg-brand hover:bg-brand-dark text-white shadow-btn hover:shadow-btn-lg hover:-translate-y-px'
              }`}
            >
              Get Started →
            </button>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default PlansSection;

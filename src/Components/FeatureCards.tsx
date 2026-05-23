const FEATURES = [
  {
    icon: '🤖',
    gradient: 'from-blue-50 to-indigo-50',
    iconBg: 'bg-blue-100',
    accent: 'text-blue-600',
    title: 'AI-Powered Claims',
    desc: 'Instant claim status via our Lex AI — no hold music, no wait times, answers in seconds.',
  },
  {
    icon: '📞',
    gradient: 'from-cyan-50 to-sky-50',
    iconBg: 'bg-cyan-100',
    accent: 'text-cyan-600',
    title: 'Voice & Chat Support',
    desc: 'Connect via voice or live chat. Proficiency-based routing gets you the right agent, fast.',
  },
  {
    icon: '🔒',
    gradient: 'from-green-50 to-emerald-50',
    iconBg: 'bg-green-100',
    accent: 'text-green-600',
    title: 'Secure & Compliant',
    desc: 'Amazon Cognito auth, role-based access, and Contact Lens analytics for full compliance.',
  },
  {
    icon: '📊',
    gradient: 'from-amber-50 to-yellow-50',
    iconBg: 'bg-amber-100',
    accent: 'text-amber-600',
    title: 'Real-Time Analytics',
    desc: 'Sentiment analysis and transcript insights on every interaction via Contact Lens.',
  },
  {
    icon: '🌐',
    gradient: 'from-purple-50 to-violet-50',
    iconBg: 'bg-purple-100',
    accent: 'text-purple-600',
    title: 'Multilingual Support',
    desc: 'Serving customers in English and Spanish — more languages via Amazon Lex locales.',
  },
  {
    icon: '⚡',
    gradient: 'from-orange-50 to-red-50',
    iconBg: 'bg-orange-100',
    accent: 'text-orange-600',
    title: 'Instant Callback',
    desc: "Can't wait? Request a callback and we'll ring you the moment an agent is free.",
  },
];

const FeatureCards = () => (
  <section className="bg-white py-24 px-6 lg:px-10">
    <div className="max-w-[1280px] mx-auto">
      {/* Section header */}
      <div className="max-w-[560px] mb-14">
        <p className="text-brand text-[12px] font-bold tracking-[2px] uppercase mb-3">Why Choose Kiro</p>
        <h2 className="text-[36px] font-extrabold text-gray-900 tracking-tight leading-[1.15] mb-4">
          Everything you need,{' '}
          <span className="text-gradient">all in one place</span>
        </h2>
        <p className="text-gray-500 text-[16px] leading-[1.7]">
          From instant AI answers to human specialists — we've built the most seamless insurance experience available.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className={`bg-gradient-to-br ${f.gradient} border border-white rounded-2xl p-6 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200 group cursor-default`}
          >
            <div className={`w-12 h-12 ${f.iconBg} rounded-2xl flex items-center justify-center text-[22px] mb-5 shadow-sm`}>
              {f.icon}
            </div>
            <h3 className="text-[15px] font-bold text-gray-900 mb-2">{f.title}</h3>
            <p className="text-[13px] text-gray-500 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default FeatureCards;

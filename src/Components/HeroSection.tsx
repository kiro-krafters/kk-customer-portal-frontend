const STATS = [
  { num: '98%', lbl: 'Satisfaction Rate' },
  { num: '<30s', lbl: 'Avg Response' },
  { num: '24/7', lbl: 'AI Support' },
  { num: '500K+', lbl: 'Customers' },
];

const DEMO_MESSAGES = [
  { from: 'bot', text: "Hi! I'm Kira 👋 How can I help with your insurance today?" },
  { from: 'user', text: 'Check my claim #CLM-2024-8841' },
  { from: 'bot', text: 'Claim #CLM-2024-8841 is under review. Est. 3–5 days. Need an agent? 🎯' },
];

const HeroSection = () => {
  const openChat = () => window.dispatchEvent(new CustomEvent('kiro:open-chat'));

  return (
    <section className="relative bg-hero-gradient overflow-hidden px-6 lg:px-10 pt-20 pb-24">
      {/* Decorative blobs */}
      <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-brand-100 opacity-40 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-[350px] h-[350px] rounded-full bg-purple-100 opacity-30 blur-3xl pointer-events-none" />

      <div className="relative max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

        {/* Left — copy */}
        <div>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white border border-brand-200 text-brand text-[12px] font-semibold px-3.5 py-1.5 rounded-full mb-7 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse-slow" />
            AI-Powered Insurance Support · Available 24/7
          </div>

          <h1 className="text-[46px] lg:text-[56px] font-extrabold text-gray-900 leading-[1.05] tracking-tight mb-6">
            Insurance Help,{' '}
            <span className="relative">
              <span className="text-gradient">Instantly.</span>
            </span>
          </h1>

          <p className="text-gray-500 text-[17px] leading-[1.75] mb-9 max-w-[460px]">
            File claims, check coverage, and get answers in seconds — powered by AI that truly understands your needs.
          </p>

          <div className="flex flex-wrap gap-3 mb-10">
            <button
              onClick={openChat}
              className="bg-brand hover:bg-brand-dark text-white font-bold text-[15px] px-7 py-3.5 rounded-xl transition-all shadow-btn hover:shadow-btn-lg hover:-translate-y-0.5 active:translate-y-0"
            >
              Start a Chat →
            </button>
            <a
              href="/claims"
              className="bg-white border border-border text-gray-700 hover:border-brand-200 hover:text-brand font-semibold text-[15px] px-7 py-3.5 rounded-xl transition-all no-underline shadow-card hover:-translate-y-0.5"
            >
              File a Claim
            </a>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-8">
            {STATS.map(({ num, lbl }, i) => (
              <div key={lbl} className={`${i !== 0 ? 'pl-8 border-l border-border' : ''}`}>
                <div className="text-[26px] font-extrabold text-gray-900 leading-none">{num}</div>
                <div className="text-[12px] text-gray-400 font-medium mt-1">{lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — chat preview card */}
        <div className="relative">
          {/* Glow behind card */}
          <div className="absolute inset-0 bg-brand-gradient opacity-10 blur-2xl rounded-3xl scale-105 pointer-events-none" />

          <div className="relative bg-white rounded-2xl border border-border shadow-card-hover p-6">
            {/* Card header */}
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border">
              <div className="w-10 h-10 rounded-full bg-brand-gradient flex items-center justify-center text-white text-lg font-bold shadow-btn flex-shrink-0">
                K
              </div>
              <div>
                <div className="text-gray-900 font-bold text-[14px]">Kira AI Assistant</div>
                <div className="text-[12px] text-green-500 flex items-center gap-1.5 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse-slow" />
                  Online · Avg reply &lt;30s
                </div>
              </div>
              <span className="ml-auto text-[11px] text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg font-medium">Live Demo</span>
            </div>

            {/* Messages */}
            <div className="flex flex-col gap-3 mb-5">
              {DEMO_MESSAGES.map((m, i) => (
                <div key={i} className={`flex gap-2 items-end ${m.from === 'user' ? 'flex-row-reverse' : ''}`}>
                  {m.from === 'bot' && (
                    <div className="w-7 h-7 rounded-full bg-brand-gradient flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                      K
                    </div>
                  )}
                  <div
                    className={`max-w-[230px] px-3.5 py-2.5 text-[13px] leading-[1.55] rounded-2xl ${
                      m.from === 'bot'
                        ? 'bg-gray-50 text-gray-700 border border-border rounded-bl-sm'
                        : 'bg-brand text-white rounded-br-sm shadow-btn'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Typing indicator */}
            <div className="flex gap-2 items-center mb-4 pl-9">
              <div className="bg-gray-50 border border-border rounded-2xl rounded-bl-sm px-3.5 py-2.5 flex gap-1 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <input
                className="flex-1 bg-gray-50 border border-border rounded-xl px-4 py-2.5 text-[13px] text-gray-400 outline-none"
                placeholder="Type your message..."
                readOnly
              />
              <button
                onClick={openChat}
                className="w-10 h-10 rounded-xl bg-brand hover:bg-brand-dark flex items-center justify-center text-white border-none transition-colors shadow-btn"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8h10M9 5l3 3-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

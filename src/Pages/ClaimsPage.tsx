const ClaimsPage = () => (
  <section className="min-h-[70vh] flex flex-col items-center justify-center py-20 px-6 bg-hero-gradient relative overflow-hidden">
    <div className="absolute -top-24 -right-24 w-[400px] h-[400px] rounded-full bg-brand-100 opacity-40 blur-3xl pointer-events-none" />
    <div className="relative text-center max-w-[480px]">
      <div className="w-16 h-16 rounded-2xl bg-brand-gradient flex items-center justify-center text-[28px] mb-6 mx-auto shadow-btn-lg">
        ⚡
      </div>
      <p className="text-brand text-[12px] font-bold tracking-[2px] uppercase mb-3">Claims Portal</p>
      <h1 className="text-[36px] font-extrabold text-gray-900 tracking-tight leading-[1.1] mb-4">
        File & Track Your Claim
      </h1>
      <p className="text-[15px] text-gray-500 leading-relaxed mb-8">
        Our full self-service claims portal is coming soon. In the meantime, chat with a claims specialist right now — average response under 30 seconds.
      </p>
      <button
        onClick={() => window.dispatchEvent(new CustomEvent('kiro:open-chat'))}
        className="bg-brand-gradient text-white font-bold text-[15px] px-8 py-4 rounded-xl border-none transition-all shadow-btn hover:shadow-btn-lg hover:-translate-y-0.5 active:translate-y-0"
      >
        Chat with Claims Agent →
      </button>
      <p className="text-[12px] text-gray-400 mt-4">Available 24/7 · No hold music</p>
    </div>
  </section>
);

export default ClaimsPage;

const Footer = () => (
  <footer className="bg-navy px-6 lg:px-10 pt-16 pb-8">
    <div className="max-w-[1280px] mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">

        {/* Brand */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center text-white text-lg shadow-btn">
              🛡️
            </div>
            <span className="text-white text-[17px] font-extrabold tracking-tight">
              Kiro <span className="text-brand-light">Insurance</span>
            </span>
          </div>
          <p className="text-gray-400 text-[14px] leading-relaxed max-w-[260px] mb-6">
            AI-powered insurance support — available 24/7. Instant help for claims, policy questions, billing, and more.
          </p>
          {/* Trust badges */}
          <div className="flex gap-2 flex-wrap">
            {['AWS Powered', 'SOC 2 Type II', 'HIPAA Ready'].map((b) => (
              <span key={b} className="bg-navy-mid text-gray-400 text-[11px] font-semibold px-2.5 py-1 rounded-md border border-white/10">
                {b}
              </span>
            ))}
          </div>
        </div>

        {/* Products */}
        <div>
          <h4 className="text-white text-[12px] font-bold uppercase tracking-[1.5px] mb-5">Plans</h4>
          {['Basic Shield', 'Premium Guard', 'Elite Fortress', 'Business Plans'].map((l) => (
            <a key={l} href="#" className="block text-gray-400 hover:text-white text-[14px] mb-2.5 no-underline transition-colors">
              {l}
            </a>
          ))}
        </div>

        {/* Support */}
        <div>
          <h4 className="text-white text-[12px] font-bold uppercase tracking-[1.5px] mb-5">Support</h4>
          {['File a Claim', 'Policy Info', 'Contact Us', 'Live Chat'].map((l) => (
            <a key={l} href="#" className="block text-gray-400 hover:text-white text-[14px] mb-2.5 no-underline transition-colors">
              {l}
            </a>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
        <p className="text-gray-500 text-[13px]">© 2025 Kiro Krafters. All rights reserved.</p>
        <p className="text-gray-500 text-[13px]">Powered by Amazon Connect · AWS Lex · Contact Lens</p>
      </div>
    </div>
  </footer>
);

export default Footer;

import { Link, useLocation } from 'react-router';

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Claims', to: '/claims' },
  { label: 'Policy', to: '/policy' },
  { label: 'Callback', to: '/callback' },
  { label: 'Contact', to: '/contact' },
];

const Navbar = () => {
  const { pathname } = useLocation();

  return (
    <header className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-border shadow-nav">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 h-[68px] flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 no-underline group">
          <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center text-white text-lg shadow-btn flex-shrink-0">
            🛡️
          </div>
          <div className="leading-none">
            <span className="text-gray-900 text-[17px] font-extrabold tracking-tight">Kiro</span>
            <span className="text-brand text-[17px] font-extrabold tracking-tight"> Insurance</span>
          </div>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ label, to }) => (
            <Link
              key={to}
              to={to}
              className={`text-[14px] font-medium px-4 py-2 rounded-lg transition-all no-underline ${
                pathname === to
                  ? 'text-brand bg-brand-100 font-semibold'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('kiro:open-chat'))}
          className="bg-brand hover:bg-brand-dark text-white font-semibold text-[14px] px-5 py-2.5 rounded-xl transition-all shadow-btn hover:shadow-btn-lg hover:-translate-y-px active:translate-y-0"
        >
          Get Support
        </button>
      </div>
    </header>
  );
};

export default Navbar;

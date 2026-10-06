import { useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { hospitalInfo } from '../data/hospitalData';
import { useAuth } from '../auth/useAuth';

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/services', label: 'Services' },
  { to: '/doctors', label: 'Doctors' },
  { to: '/contact', label: 'Contact' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [menuState, setMenuState] = useState({ pathname: location.pathname, open: false });
  const menuOpen = menuState.pathname === location.pathname && menuState.open;
  const menuButton = useRef<HTMLButtonElement>(null);
  const changeMenuOpen = (open: boolean) => setMenuState({ pathname: location.pathname, open });
  const { session, signOut } = useAuth();
  const notice = (location.state as { notice?: string } | null)?.notice;
  const scrollHomeToTop = () => {
    window.setTimeout(() => {
      document.getElementById('main-content')?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }, 0);
  };
  const workspaceLink = session
    ? { to: session.user.role === 'admin' ? '/admin-dashboard' : '/patient-dashboard', label: session.user.role === 'admin' ? 'Admin' : 'Patient' }
    : { to: '/login', label: 'Sign in' };

  return (
    <div className="site-shell">
      <div className="floating-contact">
        <a href={`https://wa.me/${hospitalInfo.whatsapp}`} target="_blank" rel="noreferrer" className="floating-btn whatsapp" aria-label="WhatsApp contact">
          <i className="bi bi-whatsapp" aria-hidden="true" />
        </a>
        <a href={`tel:${hospitalInfo.phone.replace(/[^\d+]/g, '')}`} className="floating-btn call" aria-label="Call hospital">
          <i className="bi bi-telephone-fill" aria-hidden="true" />
        </a>
      </div>

      <header className="topbar">
        <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm py-3">
          <div className="container">
            <Link className="navbar-brand fw-semibold" to="/" onClick={scrollHomeToTop}>
              <span className="brand-primary">Sanjeevani</span>&nbsp;
              <span className="brand-light">Hospital</span>
            </Link>

            <button
              className="navbar-toggler"
              type="button"
              aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={menuOpen}
              aria-controls="navbarNav"
              ref={menuButton}
              onClick={() => changeMenuOpen(!menuOpen)}
              onKeyDown={(event) => {
                if (event.key === 'Escape' && menuOpen) {
                  changeMenuOpen(false);
                  menuButton.current?.focus();
                }
              }}
            >
              <span aria-hidden="true">{menuOpen ? '×' : '☰'}</span>
            </button>

            <div
              className={`navbar-collapse${menuOpen ? ' is-open' : ''}`}
              id="navbarNav"
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  changeMenuOpen(false);
                  menuButton.current?.focus();
                }
              }}
            >
              <ul className="navbar-nav ms-auto">
                {[...navItems, workspaceLink].map((item) => (
                  <li key={item.to} className="nav-item">
                    <NavLink
                      className="nav-link"
                      to={item.to}
                      end={item.to === '/'}
                      onClick={() => {
                        changeMenuOpen(false);
                        if (item.to === '/') scrollHomeToTop();
                      }}
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}
                {session && <li className="nav-item">
                  <button className="nav-link border-0 bg-transparent" type="button" onClick={() => { signOut(); changeMenuOpen(false); }}>Sign out</button>
                </li>}
              </ul>
            </div>
          </div>
        </nav>
      </header>

      {notice && (
        <div className="container mt-3">
          <div className="alert alert-success mb-0" role="status">{notice}</div>
        </div>
      )}

      <main id="main-content" tabIndex={-1}>{children}</main>

      <footer className="footer-contact bg-light pt-5">
        <div className="container">
          <div className="row g-5">
            <div className="col-lg-4">
              <h5 className="footer-title">{hospitalInfo.name}</h5>
              <p className="text-muted">
                Sanjeevani Multispeciality Hospital provides compassionate and advanced healthcare services in Nagpur since 2001.
              </p>
              <div className="footer-contact-links">
                <p>
                  <i className="bi bi-telephone-fill footer-color" aria-hidden="true" />
                  <a href={`tel:${hospitalInfo.phone.replace(/[^\d+]/g, '')}`} className="footer-color text-decoration-none">{hospitalInfo.phone}</a>
                </p>
                <p>
                  <i className="bi bi-whatsapp footer-color" aria-hidden="true" />
                  <a href={`https://wa.me/${hospitalInfo.whatsapp}`} className="footer-color text-decoration-none" target="_blank" rel="noreferrer">
                    {hospitalInfo.whatsapp}
                  </a>
                </p>
                <p>
                  <i className="bi bi-geo-alt-fill footer-color" aria-hidden="true" />
                  {hospitalInfo.address}
                </p>
              </div>
            </div>

            <div className="col-lg-3">
              <h5 className="footer-title">Quick Links</h5>
              <ul className="footer-links">
                {navItems.slice(0, 5).map((item) => (
                  <li key={item.to}><Link to={item.to} onClick={item.to === '/' ? scrollHomeToTop : undefined}>{item.label}</Link></li>
                ))}
              </ul>
            </div>

            <div className="col-lg-5">
              <h5 className="footer-title">Find Us</h5>
              <div className="footer-map">
                <iframe
                  title="Hospital location"
                  src="https://maps.google.com/maps?q=Sanjeevani%20Multispeciality%20Hospital%20Jaripatka%20Nagpur&t=&z=15&ie=UTF8&iwloc=&output=embed"
                  width="100%"
                  height="220"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="text-center pb-3 mt-4">
          <p className="mb-0 text-muted">© 2026 Sanjeevani Hospital, Nagpur. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}

import { useLayoutEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

export default function ScrollToTop() {
  const { key, pathname } = useLocation();
  const navigationType = useNavigationType();
  const scrollToTop = () => {
    document.getElementById('main-content')?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  };

  useLayoutEffect(() => {
    if (pathname === '/' || navigationType !== 'POP') {
      const timeout = window.setTimeout(scrollToTop, 0);
      return () => window.clearTimeout(timeout);
    }
    return undefined;
  }, [key, navigationType, pathname]);

  useLayoutEffect(() => {
    const ensureHomeStartsAtTop = () => {
      if (window.location.pathname.endsWith('/')) {
        document.getElementById('main-content')?.focus({ preventScroll: true });
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      }
    };
    window.addEventListener('pageshow', ensureHomeStartsAtTop);
    return () => window.removeEventListener('pageshow', ensureHomeStartsAtTop);
  }, []);

  return null;
}

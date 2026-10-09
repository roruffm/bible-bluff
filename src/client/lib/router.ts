import { useEffect, useState } from 'preact/hooks';

export type Route =
  | { name: 'home' }
  | { name: 'create' }
  | { name: 'room'; code: string }
  | { name: 'tv'; code: string }
  | { name: 'recap'; id: string }
  | { name: 'admin' };

export function parseRoute(pathname: string): Route {
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] === 'neu') return { name: 'create' };
  if (parts[0] === 'r' && parts[1]) return { name: 'room', code: parts[1].toUpperCase() };
  if (parts[0] === 'tv' && parts[1]) return { name: 'tv', code: parts[1].toUpperCase() };
  if (parts[0] === 'e' && parts[1]) return { name: 'recap', id: parts[1].toLowerCase() };
  if (parts[0] === 'admin') return { name: 'admin' };
  return { name: 'home' };
}

export function navigate(path: string, replace = false) {
  if (replace) history.replaceState(null, '', path);
  else history.pushState(null, '', path);
  window.dispatchEvent(new Event('bb:navigate'));
  window.scrollTo(0, 0);
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseRoute(location.pathname));
  useEffect(() => {
    const update = () => setRoute(parseRoute(location.pathname));
    window.addEventListener('popstate', update);
    window.addEventListener('bb:navigate', update);
    return () => {
      window.removeEventListener('popstate', update);
      window.removeEventListener('bb:navigate', update);
    };
  }, []);
  return route;
}

export function roomUrl(code: string): string {
  return `${location.origin}/r/${code}`;
}

/** Dauerhafte Entdeckungen-Seite einer Partie */
export function recapUrl(id: string): string {
  return `${location.origin}/e/${id}`;
}

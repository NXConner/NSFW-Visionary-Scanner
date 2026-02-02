import { Navigate, useLocation } from "react-router-dom";

/**
 * Legacy admin path redirector.
 *
 * We historically had users/bookmarks hitting `/afmin/*` (typo) instead of `/admin/*`.
 * Keep this redirect in place for backward compatibility so those links never 404.
 */
export default function LegacyAdminRedirect() {
  const location = useLocation();

  const nextPathname = location.pathname.replace(/^\/afmin(\/|$)/, "/admin$1");
  const to = `${nextPathname}${location.search}${location.hash}`;

  return <Navigate to={to} replace />;
}

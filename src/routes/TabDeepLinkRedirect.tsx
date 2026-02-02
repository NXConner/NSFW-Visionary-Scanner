import React, { useMemo } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import { resolveTabRequest } from "@/lib/navigation/tabRouting";
import NotFound from "@/pages/NotFound";

const TAB_DEEP_LINK_ALIASES: Record<string, string> = {
  // Common human-friendly variants
  "3d-viewer": "3dviewer",
  "3dviewer": "3dviewer",
  peprogress: "pe-progress",
  pephotos: "pe-progress",
};

export default function TabDeepLinkRedirect(): React.ReactElement {
  const params = useParams();
  const location = useLocation();

  const resolvedTab = useMemo(() => {
    const raw = String(params.tab ?? "").trim();
    if (!raw) return null;

    const key = raw.toLowerCase();
    const candidate = TAB_DEEP_LINK_ALIASES[key] ?? key;
    return resolveTabRequest(candidate) ? candidate : null;
  }, [params.tab]);

  if (!resolvedTab) return <NotFound />;

  const searchParams = new URLSearchParams(location.search);
  searchParams.set("tab", resolvedTab);
  const search = searchParams.toString();
  const hash = location.hash || "";

  return <Navigate replace to={`/app${search ? `?${search}` : ""}${hash}`} />;
}

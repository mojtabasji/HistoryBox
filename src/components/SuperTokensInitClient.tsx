"use client";
import { useEffect } from "react";

declare global {
  interface Window { __ST_INIT__?: boolean }
}

export default function SuperTokensInitClient({ onReady }: { onReady?: () => void }) {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (typeof window === "undefined" || window.__ST_INIT__) {
        if (!cancelled) onReady?.();
        return;
      }
      const [{ default: SuperTokensReact }, { default: Passwordless }, { default: Session }] = await Promise.all([
        import("supertokens-auth-react"),
        import("supertokens-auth-react/recipe/passwordless"),
        import("supertokens-auth-react/recipe/session"),
      ]);

      if (cancelled) return;

      SuperTokensReact.init({
        appInfo: {
          appName: "History Box",
          apiDomain: process.env.NEXT_PUBLIC_API_DOMAIN || "http://localhost:3000",
          apiBasePath: "/api/auth",
          websiteDomain: process.env.NEXT_PUBLIC_WEBSITE_DOMAIN || "http://localhost:3000",
          websiteBasePath: "/login",
        },
        recipeList: [
          Passwordless.init({
            contactMethod: "PHONE",
            signInUpFeature: {
              // Set default country to Iran (+98)
              defaultCountry: "IR",
            },
          }),
          Session.init({
            tokenTransferMethod: 'cookie',
          }),
        ],
      });
      window.__ST_INIT__ = true;
      onReady?.();
    })();

    return () => { cancelled = true; };
  }, [onReady]);

  return null;
}

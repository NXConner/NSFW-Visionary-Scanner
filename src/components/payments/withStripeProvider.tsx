import React from "react";

import { StripeProvider } from "@/components/payments/StripeProvider";

// Higher-order component for wrapping components that need Stripe
export const withStripeProvider = <P extends object>(Component: React.ComponentType<P>) => {
  const Wrapped = (props: P) => (
    <StripeProvider>
      <Component {...props} />
    </StripeProvider>
  );

  Wrapped.displayName = `withStripeProvider(${Component.displayName || Component.name || "Component"})`;
  return Wrapped;
};

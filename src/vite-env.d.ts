/// <reference types="vite/client" />

declare module "virtual:pwa-register" {
  export type RegisterSWOptions = {
    immediate?: boolean;
    onRegistered?: (swUrl: string, registration: ServiceWorkerRegistration | undefined) => void;
    onRegisterError?: (error: unknown) => void;
  };

  export function registerSW(options?: RegisterSWOptions): (reloadPage?: boolean) => Promise<void>;
}

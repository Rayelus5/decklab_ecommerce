// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://b914eb60df91ea687ae584c9f19ee372@o4511461982404608.ingest.de.sentry.io/4511461984632912",

  // Add optional integrations for additional features
  integrations: [Sentry.replayIntegration()],

  // 10% de transacciones en producción — suficiente para detectar problemas sin coste excesivo
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,

  enableLogs: true,

  // 1% de sesiones normales, 100% cuando hay error
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,

  // Enviar info de usuario a Sentry (nombre, email) para identificar errores por usuario
  sendDefaultPii: true,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

import Stripe from "stripe";

// El código está escrito contra la API "2024-12-18.acacia". El SDK v20 solo tipa
// la última versión, así que hacemos cast para mantener el comportamiento en
// runtime: cambiar de versión altera la forma de las respuestas de Stripe.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
});

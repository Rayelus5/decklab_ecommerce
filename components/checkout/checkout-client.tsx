"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckoutErrorBoundary } from "@/components/error-boundary";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, MapPin, Truck, Tag, CreditCard, Check, AlertTriangle } from "lucide-react";
import { clsx } from "clsx";
import { useCart } from "@/lib/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { checkoutSchema, type CheckoutFormData } from "@/lib/validations";

interface Address {
  id: string;
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  postalCode: string;
  province?: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

interface ShippingRate {
  id: string;
  name: string;
  type: string;
  region: string;
  minWeight: number;
  maxWeight: number;
  price: number;
}

interface CheckoutClientProps {
  userId: string;
  isPro: boolean;
  proAllowanceBalance: number;
  hasFreeShipping: boolean;
  addresses: Address[];
  shippingRates: ShippingRate[];
}

const STEPS = [
  { id: 1, label: "Dirección", icon: MapPin },
  { id: 2, label: "Envío", icon: Truck },
  { id: 3, label: "Cupón", icon: Tag },
  { id: 4, label: "Pago", icon: CreditCard },
] as const;

// Detectar región por código de país
function detectRegion(country: string): "NATIONAL" | "EUROPE" {
  return country.toUpperCase() === "ES" ? "NATIONAL" : "EUROPE";
}

export function CheckoutClient({
  userId,
  isPro,
  proAllowanceBalance,
  hasFreeShipping,
  addresses,
  shippingRates,
}: CheckoutClientProps) {
  const router = useRouter();
  const { items, clearCart, getTotalWeight } = useCart();
  const subtotal = useCart((s) => s.getSubtotal(isPro, proAllowanceBalance));

  const [step, setStep] = useState(1);
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const { register, watch, setValue, formState: { errors } } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      addressId: addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? "",
      shippingRateId: "",
      paymentMethod: "STRIPE",
    },
  });

  const selectedAddressId = watch("addressId");
  const selectedShippingRateId = watch("shippingRateId");
  const paymentMethod = watch("paymentMethod");

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
  const selectedRegion = selectedAddress ? detectRegion(selectedAddress.country) : "NATIONAL";
  const totalWeight = getTotalWeight();

  // Filtrar tarifas de envío aplicables
  const applicableRates = shippingRates.filter((rate) => {
    if (rate.region !== selectedRegion) return false;
    if (rate.minWeight > totalWeight) return false;
    if (rate.maxWeight !== -1 && rate.maxWeight < totalWeight) return false;
    return true;
  });

  const selectedRate = applicableRates.find((r) => r.id === selectedShippingRateId);
  const shippingCost = hasFreeShipping ? 0 : (selectedRate?.price ?? 0);
  const total = subtotal + shippingCost - couponDiscount;

  async function applyCoupon() {
    if (!couponCode.trim()) return;
    setCouponLoading(true);

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim().toUpperCase(), subtotal }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Cupón inválido");
        setCouponDiscount(0);
        return;
      }

      setCouponDiscount(data.discount ?? 0);
      toast.success(`Cupón aplicado: -${data.discount.toFixed(2)} €`);
    } catch {
      toast.error("Error al validar el cupón");
    } finally {
      setCouponLoading(false);
    }
  }

  function buildCheckoutBody() {
    return {
      addressId: selectedAddressId,
      shippingRateId: selectedShippingRateId,
      couponCode: couponCode || undefined,
      items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
    };
  }

  async function handleStripeCheckout() {
    if (!selectedAddressId || !selectedShippingRateId) {
      toast.error("Selecciona una dirección y método de envío");
      return;
    }
    setPaymentLoading(true);
    try {
      const res = await fetch("/api/checkout/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildCheckoutBody()),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Error al iniciar el pago con Stripe");
        return;
      }
      window.location.href = data.url;
    } catch {
      toast.error("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setPaymentLoading(false);
    }
  }

  async function handlePaypalCheckout() {
    if (!selectedAddressId || !selectedShippingRateId) {
      toast.error("Selecciona una dirección y método de envío");
      return;
    }
    setPaymentLoading(true);
    try {
      const res = await fetch("/api/checkout/paypal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildCheckoutBody()),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Error al iniciar el pago con PayPal");
        return;
      }
      // Redirigir a la página de aprobación de PayPal
      window.location.href = data.url;
    } catch {
      toast.error("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setPaymentLoading(false);
    }
  }

  function handleConfirmPayment() {
    if (paymentMethod === "PAYPAL") {
      return handlePaypalCheckout();
    }
    return handleStripeCheckout();
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center flex flex-col items-center gap-5">
        <p className="text-lg text-snow font-medium">Tu carrito está vacío</p>
        <Link href="/products">
          <Button>Ir a la tienda</Button>
        </Link>
      </div>
    );
  }

  return (
    <CheckoutErrorBoundary>
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/cart"
          className="text-sm text-slate-300 hover:text-snow transition-colors flex items-center gap-1.5"
        >
          <ArrowLeft size={15} />
          Carrito
        </Link>
        <h1 className="text-xl font-semibold text-snow">Checkout</h1>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-0 mb-8 overflow-x-auto pb-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = step === s.id;
          const isCompleted = step > s.id;

          return (
            <div key={s.id} className="flex items-center">
              <button
                onClick={() => isCompleted && setStep(s.id)}
                disabled={!isCompleted}
                className={clsx(
                  "flex items-center gap-2 px-3 py-2 rounded-[8px] text-sm font-medium transition-colors whitespace-nowrap",
                  isActive && "bg-ash-50 text-graphite-700",
                  isCompleted && !isActive && "text-snow hover:bg-white/5 cursor-pointer",
                  !isActive && !isCompleted && "text-slate-300 cursor-default"
                )}
              >
                {isCompleted ? (
                  <Check size={14} className="text-mint-signal" />
                ) : (
                  <Icon size={14} />
                )}
                {s.label}
              </button>
              {i < STEPS.length - 1 && (
                <div className="w-6 h-px bg-white/15 mx-1" aria-hidden="true" />
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contenido del step */}
        <div className="lg:col-span-2">
          {/* Step 1 — Dirección */}
          {step === 1 && (
            <div className="bg-graphite-700/40 border border-white/8 rounded-[16px] p-5 flex flex-col gap-4">
              <h2 className="text-base font-semibold text-snow flex items-center gap-2">
                <MapPin size={16} className="text-slate-300" />
                Dirección de envío
              </h2>

              {addresses.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-slate-300 mb-3">
                    No tienes direcciones guardadas.
                  </p>
                  <Link
                    href="/profile/addresses?redirect=/checkout"
                    className="text-sm text-ash-50 hover:text-snow underline underline-offset-2"
                  >
                    Añadir una dirección →
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {addresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={clsx(
                        "flex items-start gap-3 p-4 rounded-[11px] border cursor-pointer transition-all",
                        selectedAddressId === addr.id
                          ? "border-ash-50/40 bg-ash-50/5"
                          : "border-white/8 hover:border-white/15"
                      )}
                    >
                      <input
                        type="radio"
                        value={addr.id}
                        {...register("addressId")}
                        className="mt-1 accent-ash-50"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {addr.label && (
                            <span className="text-xs font-semibold text-snow">{addr.label}</span>
                          )}
                          {addr.isDefault && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-white/10 text-slate-300 rounded-[4px]">
                              Predeterminada
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-snow mt-0.5">
                          {addr.line1}
                          {addr.line2 && `, ${addr.line2}`}
                        </p>
                        <p className="text-xs text-slate-300">
                          {addr.postalCode} {addr.city}
                          {addr.province && `, ${addr.province}`} — {addr.country}
                        </p>
                        <p className="text-xs text-slate-300">{addr.phone}</p>
                      </div>
                    </label>
                  ))}
                  <Link
                    href="/profile/addresses?redirect=/checkout"
                    className="text-xs text-slate-300 hover:text-snow transition-colors flex items-center gap-1 mt-1"
                  >
                    + Añadir nueva dirección
                  </Link>
                </div>
              )}

              <Button
                onClick={() => selectedAddressId && setStep(2)}
                disabled={!selectedAddressId}
                fullWidth
                size="lg"
                className="mt-2"
              >
                Continuar
                <ArrowRight size={15} />
              </Button>
            </div>
          )}

          {/* Step 2 — Envío */}
          {step === 2 && (
            <div className="bg-graphite-700/40 border border-white/8 rounded-[16px] p-5 flex flex-col gap-4">
              <h2 className="text-base font-semibold text-snow flex items-center gap-2">
                <Truck size={16} className="text-slate-300" />
                Método de envío
              </h2>

              {hasFreeShipping && (
                <div className="bg-mint-signal/10 border border-mint-signal/20 rounded-[8px] px-3 py-2">
                  <p className="text-xs text-mint-signal font-medium">
                    ✓ Envío gratuito incluido en tu plan PRO
                  </p>
                </div>
              )}

              {applicableRates.length === 0 ? (
                <p className="text-sm text-slate-300 py-4 text-center">
                  No hay métodos de envío disponibles para tu dirección. Contacta con soporte.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {applicableRates.map((rate) => {
                    const effectivePrice = hasFreeShipping ? 0 : rate.price;
                    return (
                      <label
                        key={rate.id}
                        className={clsx(
                          "flex items-start gap-3 p-4 rounded-[11px] border cursor-pointer transition-all",
                          selectedShippingRateId === rate.id
                            ? "border-ash-50/40 bg-ash-50/5"
                            : "border-white/8 hover:border-white/15"
                        )}
                      >
                        <input
                          type="radio"
                          value={rate.id}
                          {...register("shippingRateId")}
                          className="mt-1 accent-ash-50"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-sm font-medium text-snow">{rate.name}</span>
                              <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-white/8 text-slate-300 rounded-[4px] uppercase">
                                {rate.type}
                              </span>
                            </div>
                            <span className="text-sm font-semibold text-snow">
                              {effectivePrice === 0 ? (
                                <span className="text-mint-signal">Gratis</span>
                              ) : (
                                `${effectivePrice.toFixed(2).replace(".", ",")} €`
                              )}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-0.5">
                            {rate.region === "NATIONAL" ? "España peninsular" : "Europa"} ·{" "}
                            {rate.maxWeight === -1
                              ? `Desde ${rate.minWeight}g`
                              : `${rate.minWeight}g — ${rate.maxWeight}g`}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} size="lg" className="flex-1">
                  <ArrowLeft size={15} />
                  Volver
                </Button>
                <Button
                  onClick={() => selectedShippingRateId && setStep(3)}
                  disabled={!selectedShippingRateId && applicableRates.length > 0}
                  size="lg"
                  className="flex-1"
                >
                  Continuar
                  <ArrowRight size={15} />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3 — Cupón */}
          {step === 3 && (
            <div className="bg-graphite-700/40 border border-white/8 rounded-[16px] p-5 flex flex-col gap-4">
              <h2 className="text-base font-semibold text-snow flex items-center gap-2">
                <Tag size={16} className="text-slate-300" />
                Código de descuento
              </h2>
              <p className="text-sm text-slate-300">
                Si tienes un cupón de descuento, introdúcelo aquí. Es opcional.
              </p>

              <div className="flex gap-2">
                <Input
                  placeholder="CÓDIGO-DESCUENTO"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="flex-1 uppercase"
                  aria-label="Código de cupón"
                />
                <Button
                  onClick={applyCoupon}
                  loading={couponLoading}
                  variant="outline"
                  disabled={!couponCode.trim()}
                >
                  Aplicar
                </Button>
              </div>

              {couponDiscount > 0 && (
                <div className="flex items-center justify-between bg-mint-signal/10 border border-mint-signal/20 rounded-[8px] px-3 py-2">
                  <span className="text-xs text-mint-signal font-medium">
                    Cupón aplicado: {couponCode}
                  </span>
                  <span className="text-xs text-mint-signal font-bold">
                    -{couponDiscount.toFixed(2).replace(".", ",")} €
                  </span>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} size="lg" className="flex-1">
                  <ArrowLeft size={15} />
                  Volver
                </Button>
                <Button onClick={() => setStep(4)} size="lg" className="flex-1">
                  Continuar
                  <ArrowRight size={15} />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4 — Pago */}
          {step === 4 && (
            <div className="bg-graphite-700/40 border border-white/8 rounded-[16px] p-5 flex flex-col gap-4">
              <h2 className="text-base font-semibold text-snow flex items-center gap-2">
                <CreditCard size={16} className="text-slate-300" />
                Método de pago
              </h2>

              {/* Selección de método */}
              <div className="flex flex-col gap-2">
                {[
                  { value: "STRIPE", label: "Tarjeta de crédito / débito", desc: "Visa, Mastercard, American Express. Pago seguro con Stripe." },
                  { value: "PAYPAL", label: "PayPal", desc: "Paga con tu cuenta PayPal. Redirigirás a PayPal para completar el pago." },
                ].map((method) => (
                  <label
                    key={method.value}
                    className={clsx(
                      "flex items-start gap-3 p-4 rounded-[11px] border cursor-pointer transition-all",
                      paymentMethod === method.value
                        ? "border-ash-50/40 bg-ash-50/5"
                        : "border-white/8 hover:border-white/15"
                    )}
                  >
                    <input
                      type="radio"
                      value={method.value}
                      {...register("paymentMethod")}
                      className="mt-1 accent-ash-50"
                    />
                    <div>
                      <p className="text-sm font-medium text-snow flex items-center gap-2">
                        <CreditCard size={14} className="text-slate-300" />
                        {method.label}
                      </p>
                      <p className="text-xs text-slate-300 mt-0.5">{method.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              {/* Aviso de no devoluciones */}
              <div className="bg-ember-red/10 border border-ember-red/20 rounded-[8px] px-3 py-2.5">
                <p className="text-xs text-ember-red font-medium flex items-center gap-1.5">
                  <AlertTriangle size={12} />
                  Sin devoluciones
                </p>
                <p className="text-xs text-slate-300 mt-0.5">
                  Al confirmar la compra, aceptas que no se realizan devoluciones en ningún producto de DECKLAB.
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(3)} size="lg" className="flex-1">
                  <ArrowLeft size={15} />
                  Volver
                </Button>
                <Button
                  onClick={handleConfirmPayment}
                  loading={paymentLoading}
                  size="lg"
                  className="flex-1"
                >
                  {paymentMethod === "PAYPAL" ? "Pagar con PayPal" : "Confirmar y pagar"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Resumen del pedido */}
        <div className="flex flex-col gap-4">
          <div className="bg-graphite-700/40 border border-white/8 rounded-[16px] p-5 flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-snow">Resumen del pedido</h2>

            {/* Items */}
            <div className="flex flex-col gap-2 divide-y divide-white/8">
              {items.map((item) => (
                <div key={item.variantId} className="flex justify-between gap-2 pt-2 first:pt-0 text-xs">
                  <span className="text-slate-300 line-clamp-2 flex-1">
                    {item.productTitle}
                    {item.variantTitle && ` — ${item.variantTitle}`}
                    {" "}<span className="text-slate-300/60">×{item.quantity}</span>
                  </span>
                  <span className="text-snow tabular-nums shrink-0">
                    {(item.price * item.quantity).toFixed(2).replace(".", ",")} €
                  </span>
                </div>
              ))}
            </div>

            {/* Totales */}
            <div className="border-t border-white/8 pt-3 flex flex-col gap-1.5 text-sm">
              <div className="flex justify-between text-slate-300">
                <span>Subtotal</span>
                <span className="tabular-nums">{subtotal.toFixed(2).replace(".", ",")} €</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-mint-signal">
                  <span>Cupón {couponCode}</span>
                  <span className="tabular-nums">-{couponDiscount.toFixed(2).replace(".", ",")} €</span>
                </div>
              )}
              <div className="flex justify-between text-slate-300">
                <span>Envío</span>
                <span className="tabular-nums">
                  {selectedRate
                    ? hasFreeShipping
                      ? "Gratis"
                      : `${selectedRate.price.toFixed(2).replace(".", ",")} €`
                    : "—"}
                </span>
              </div>
              {selectedRate && (
                <div className="flex justify-between font-semibold text-snow border-t border-white/8 pt-2 mt-1">
                  <span>Total</span>
                  <span className="tabular-nums">{total.toFixed(2).replace(".", ",")} €</span>
                </div>
              )}
            </div>

            {/* PRO balance */}
            {isPro && proAllowanceBalance > 0 && (
              <div className="text-xs text-amber-400/80 text-center">
                Allowance PRO disponible: {proAllowanceBalance.toFixed(2).replace(".", ",")} €
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </CheckoutErrorBoundary>
  );
}

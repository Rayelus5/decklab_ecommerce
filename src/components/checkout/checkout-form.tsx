"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/lib/store/cart";
import { useRouter } from "next/navigation";
import { getShippingRates } from "@/actions/checkout";
import { ShippingRate } from "@prisma/client";
import { Truck, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";


interface CheckoutFormProps {
    onRateSelected: (rate: ShippingRate | null) => void;
}

export default function CheckoutForm({ onRateSelected }: CheckoutFormProps) {
    const { data: session } = useSession();
    const { items } = useCartStore();

    // Calcular peso total del carrito
    const totalWeight = items.reduce((acc, item) => acc + (item.weight * item.quantity), 0);

    const [step, setStep] = useState(1); // 1: Address, 2: Shipping
    const [loadingRates, setLoadingRates] = useState(false);
    const [rates, setRates] = useState<ShippingRate[]>([]);
    const [selectedRateId, setSelectedRateId] = useState<string | null>(null);

    // Estado del formulario
    const [formData, setFormData] = useState({
        name: session?.user?.name || "",
        email: session?.user?.email || "",
        address: "",
        city: "",
        postalCode: "",
        country: "ES", // Por defecto España
    });

    const [processing, setProcessing] = useState(false); // Estado de carga
    const router = useRouter();

    const handlePayment = async () => {
        if (!selectedRateId) return;
        setProcessing(true);

        try {
            const response = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items: items, // Enviamos el carrito (backend validará precios)
                    shippingRateId: selectedRateId,
                    address: formData // Enviamos la dirección
                }),
            });

            const data = await response.json();

            if (data.url) {
                // Redirigir a Stripe
                window.location.href = data.url;
            } else {
                toast.error("Error al iniciar el pago: " + (data.error || "Desconocido"));
                setProcessing(false);
            }
        } catch (error) {
            console.error(error);
            toast.error("Error de conexión");
            setProcessing(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const calculateShipping = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingRates(true);

        // Llamada al Server Action
        const res = await getShippingRates(totalWeight, formData.country);

        if (res.success && res.rates) {
            setRates(res.rates);
            setStep(2); // Avanzar al paso de envío
        } else {
            toast.error("No hay opciones de envío para esta dirección y peso.");
        }
        setLoadingRates(false);
    };

    const handleRateSelect = (rate: ShippingRate) => {
        setSelectedRateId(rate.id);
        onRateSelected(rate); // Comunicar al padre (Page) el costo
    };

    return (
        <div className="space-y-8">
            {/* Pasos Visuales */}
            <div className="flex items-center gap-4 text-body font-medium mb-8">
                <div className={cn("flex items-center gap-2 transition-colors", step >= 1 ? "text-celestial-light" : "text-whisper-blue")}>
                    <div className={cn("w-6 h-6 rounded-full border flex items-center justify-center text-caption font-dotdigital", step >= 1 ? "border-celestial-light" : "border-white/10")}>1</div>
                    Dirección
                </div>
                <div className="h-px w-8 bg-white/5" />
                <div className={cn("flex items-center gap-2 transition-colors", step >= 2 ? "text-celestial-light" : "text-whisper-blue")}>
                    <div className={cn("w-6 h-6 rounded-full border flex items-center justify-center text-caption font-dotdigital", step >= 2 ? "border-celestial-light" : "border-white/10")}>2</div>
                    Envío
                </div>
                <div className="h-px w-8 bg-white/5" />
                <div className="flex items-center gap-2 text-whisper-blue transition-colors">
                    <div className="w-6 h-6 rounded-full border border-white/10 flex items-center justify-center text-caption font-dotdigital">3</div>
                    Pago
                </div>
            </div>

            {/* PASO 1: DIRECCIÓN */}
            {step === 1 && (
                <form onSubmit={calculateShipping} className="space-y-6 animate-in fade-in slide-in-from-left-4 rounded-[16px] bg-[rgba(186,214,247,0.01)] border border-white/5 p-6 shadow-subtle-3">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-caption uppercase text-arctic-mist font-bold font-dotdigital tracking-wider">Nombre</label>
                            <Input required name="name" value={formData.name} onChange={handleInputChange} placeholder="Juan Pérez" className="h-12" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-caption uppercase text-arctic-mist font-bold font-dotdigital tracking-wider">Email</label>
                            <Input required name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="juan@ejemplo.com" className="h-12" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-caption uppercase text-arctic-mist font-bold font-dotdigital tracking-wider">Dirección</label>
                        <Input required name="address" value={formData.address} onChange={handleInputChange} placeholder="Calle Ejemplo, 123" className="h-12" />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-caption uppercase text-arctic-mist font-bold font-dotdigital tracking-wider">Ciudad</label>
                            <Input required name="city" value={formData.city} onChange={handleInputChange} className="h-12" placeholder="Madrid" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-caption uppercase text-arctic-mist font-bold font-dotdigital tracking-wider">C. Postal</label>
                            <Input required name="postalCode" value={formData.postalCode} onChange={handleInputChange} className="h-12" placeholder="28001" />
                        </div>
                        <div className="space-y-2 col-span-2 md:col-span-1">
                            <label className="text-caption uppercase text-arctic-mist font-bold font-dotdigital tracking-wider">País</label>
                            <select name="country" value={formData.country} onChange={handleInputChange} className="flex h-12 w-full rounded-[6px] bg-[rgba(199,211,234,0.06)] border border-[rgba(186,215,247,0.14)] px-[10px] py-0 text-body text-ghost-white transition-colors focus:outline-none focus:border-celestial-light focus:ring-1 focus:ring-celestial-light/30 disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer">
                                <option value="ES">España</option>
                                <option value="FR">Francia</option>
                                <option value="DE">Alemania</option>
                                <option value="IT">Italia</option>
                                <option value="PT">Portugal</option>
                            </select>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        isLoading={loadingRates}
                        variant="solid-primary"
                        size="lg"
                        className="w-full mt-4"
                    >
                        Continuar a Envíos
                    </Button>
                </form>
            )}

            {/* PASO 2: SELECCIÓN DE ENVÍO */}
            {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <h3 className="text-subheading font-bold text-ghost-white mb-4">Método de Envío</h3>

                    <div className="p-4 bg-neon-violet/5 border border-neon-violet/20 rounded-[8px] text-body text-neon-violet mb-4 shadow-subtle-3">
                        Peso total del pedido: <strong className="font-dotdigital text-ghost-white">{totalWeight}g</strong>
                    </div>

                    {rates.length === 0 ? (
                        <div className="text-red-400 text-body">No se encontraron tarifas para esta zona/peso.</div>
                    ) : (
                        <div className="space-y-3">
                            {rates.map((rate) => (
                                <div
                                    key={rate.id}
                                    onClick={() => handleRateSelect(rate)}
                                    className={cn(
                                        "relative cursor-pointer rounded-[8px] border p-4 flex items-center justify-between transition-all",
                                        selectedRateId === rate.id
                                            ? "bg-neon-violet/10 border-neon-violet shadow-subtle-5"
                                            : "bg-[rgba(186,214,247,0.02)] border-white/5 hover:border-white/20"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn("p-3 rounded-full shadow-subtle-3", selectedRateId === rate.id ? "bg-neon-violet text-white" : "bg-[rgba(199,211,234,0.06)] text-whisper-blue")}>
                                            <Truck className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-ghost-white text-body">{rate.name}</p>
                                            <p className="text-caption text-arctic-mist uppercase tracking-wider">{rate.type}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-ghost-white text-subheading">{Number(rate.price).toFixed(2)}€</p>
                                        {selectedRateId === rate.id && <CheckCircle className="w-4 h-4 text-neon-violet ml-auto mt-1" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-4 pt-4">
                        <Button 
                            onClick={() => setStep(1)} 
                            variant="secondary-outline" 
                            size="lg"
                            className="w-1/3"
                        >
                            Atrás
                        </Button>
                        <Button
                            onClick={handlePayment}
                            disabled={!selectedRateId}
                            isLoading={processing}
                            variant="solid-primary"
                            size="lg"
                            className="flex-1"
                        >
                            Ir al Pago y Finalizar
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
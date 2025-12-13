"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/lib/store/cart";
import { useRouter } from "next/navigation"; // Importar router
import { getShippingRates } from "@/actions/checkout";
import { ShippingRate } from "@prisma/client";
import { Loader2, Truck, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import Loader from "@/components/ui/loader";


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
                alert("Error al iniciar el pago: " + (data.error || "Desconocido"));
                setProcessing(false);
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión");
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
            alert("No hay opciones de envío para esta dirección y peso.");
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
            <div className="flex items-center gap-4 text-sm font-medium mb-8">
                <div className={cn("flex items-center gap-2", step >= 1 ? "text-primary" : "text-muted-foreground")}>
                    <div className="w-6 h-6 rounded-full border flex items-center justify-center text-xs">1</div>
                    Dirección
                </div>
                <div className="h-px w-8 bg-white/10" />
                <div className={cn("flex items-center gap-2", step >= 2 ? "text-primary" : "text-muted-foreground")}>
                    <div className="w-6 h-6 rounded-full border flex items-center justify-center text-xs">2</div>
                    Envío
                </div>
                <div className="h-px w-8 bg-white/10" />
                <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="w-6 h-6 rounded-full border border-white/10 flex items-center justify-center text-xs">3</div>
                    Pago
                </div>
            </div>

            {/* PASO 1: DIRECCIÓN */}
            {step === 1 && (
                <form onSubmit={calculateShipping} className="space-y-4 animate-in fade-in slide-in-from-left-4 border rounded-2xl border-white/20 bg-card p-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs uppercase text-muted-foreground font-bold">Nombre</label>
                            <input required name="name" value={formData.name} onChange={handleInputChange} className="w-full bg-input border border-white/80 focus:border-primary rounded-lg px-4 py-3 text-white outline-none" placeholder="Juan Pérez" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs uppercase text-muted-foreground font-bold">Email</label>
                            <input required name="email" type="email" value={formData.email} onChange={handleInputChange} className="w-full bg-input border border-white/80 focus:border-primary rounded-lg px-4 py-3 text-white outline-none" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs uppercase text-muted-foreground font-bold">Dirección</label>
                        <input required name="address" value={formData.address} onChange={handleInputChange} className="w-full bg-input border border-white/80 focus:border-primary rounded-lg px-4 py-3 text-white outline-none" placeholder="Calle Ejemplo, 123" />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs uppercase text-muted-foreground font-bold">Ciudad</label>
                            <input required name="city" value={formData.city} onChange={handleInputChange} className="w-full bg-input border border-white/80 focus:border-primary rounded-lg px-4 py-3 text-white outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs uppercase text-muted-foreground font-bold">C. Postal</label>
                            <input required name="postalCode" value={formData.postalCode} onChange={handleInputChange} className="w-full bg-input border border-white/80 focus:border-primary rounded-lg px-4 py-3 text-white outline-none" />
                        </div>
                        <div className="space-y-2 col-span-2 md:col-span-1">
                            <label className="text-xs uppercase text-muted-foreground font-bold">País</label>
                            <select name="country" value={formData.country} onChange={handleInputChange} className="w-full bg-input border border-white/80 focus:border-primary rounded-lg px-4 py-3 text-white outline-none appearance-none">
                                <option value="ES">España</option>
                                <option value="FR">Francia</option>
                                <option value="DE">Alemania</option>
                                <option value="IT">Italia</option>
                                <option value="PT">Portugal</option>
                                {/* Añadir más según necesidad */}
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loadingRates}
                        className="w-full bg-white text-black font-bold py-4 rounded-xl mt-4 hover:bg-gray-200 transition disabled:opacity-50 flex justify-center cursor-pointer"
                    >
                        {loadingRates ? <Loader size={20} color="black" /> : "Continuar a Envíos"}
                    </button>
                </form>
            )}

            {/* PASO 2: SELECCIÓN DE ENVÍO */}
            {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <h3 className="text-lg font-bold text-white mb-4">Método de Envío</h3>

                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg text-sm text-primary mb-4">
                        Peso total del pedido: <strong>{totalWeight}g</strong>
                    </div>

                    {rates.length === 0 ? (
                        <div className="text-red-400">No se encontraron tarifas para esta zona/peso.</div>
                    ) : (
                        <div className="space-y-3">
                            {rates.map((rate) => (
                                <div
                                    key={rate.id}
                                    onClick={() => handleRateSelect(rate)}
                                    className={cn(
                                        "relative cursor-pointer rounded-xl border p-4 flex items-center justify-between transition-all",
                                        selectedRateId === rate.id
                                            ? "bg-primary/10 border-primary shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                                            : "bg-card border-white/10 hover:border-white/30"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn("p-2 rounded-full", selectedRateId === rate.id ? "bg-primary text-black" : "bg-white/5 text-muted-foreground")}>
                                            <Truck className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-white">{rate.name}</p>
                                            <p className="text-xs text-muted-foreground uppercase">{rate.type}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-white">{Number(rate.price).toFixed(2)}€</p>
                                        {selectedRateId === rate.id && <CheckCircle className="w-4 h-4 text-primary ml-auto mt-1" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-4 pt-4">
                        <button onClick={() => setStep(1)} className="px-6 py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 cursor-pointer">
                            Atrás
                        </button>
                        {/* Este botón lo conectaremos a Stripe en el siguiente paso */}
                        <button
                            onClick={handlePayment} // <--- Conectar función
                            disabled={!selectedRateId || processing} // <--- Deshabilitar si carga
                            className="flex-1 bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 cursor-pointer"
                        >
                            {processing ? <Loader size={20} color="black" /> : "Ir al Pago y Finalizar"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
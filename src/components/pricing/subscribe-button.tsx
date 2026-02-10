"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Loader from "@/components/ui/loader";
import { cn } from "@/lib/utils";

interface SubscribeButtonProps {
    priceId: string;
    tierId: string;
    isPopular?: boolean;
}

export default function SubscribeButton({ priceId, tierId, isPopular }: SubscribeButtonProps) {
    const [loading, setLoading] = useState(false);
    const { data: session } = useSession();
    const router = useRouter();

    const handleSubscribe = async () => {
        if (!session) {
            router.push("/login?callbackUrl=/pricing");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/subscription", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ priceId, tierId }),
            });

            const data = await res.json();

            if (data.url) {
                window.location.href = data.url;
            } else {
                alert("Error: " + (data.error || "No se pudo iniciar la suscripción"));
                setLoading(false);
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión");
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleSubscribe}
            disabled={loading}
            className={cn(
                "w-full py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2",
                isPopular
                    ? "bg-white text-black hover:bg-gray-200 shadow-lg shadow-white/10"
                    : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
            )}
        >
            {loading ? <Loader size={18} color={isPopular ? "black" : "white"} /> : "Seleccionar Plan"}
        </button>
    );
}
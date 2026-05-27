"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
                toast.error("Error: " + (data.error || "No se pudo iniciar la suscripción"));
                setLoading(false);
            }
        } catch (error) {
            console.error(error);
            toast.error("Error de conexión");
            setLoading(false);
        }
    };

    return (
        <Button
            onClick={handleSubscribe}
            isLoading={loading}
            variant={isPopular ? "solid-primary" : "secondary-outline"}
            size="lg"
            className="w-full mt-auto"
        >
            Seleccionar Plan
        </Button>
    );
}
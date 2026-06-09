import { auth } from "@/lib/auth";
import { PromotionClient } from "./promotion-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Canjear Promoción — DECKLAB",
};

export default async function PromotionPage() {
  const session = await auth();
  return <PromotionClient userId={session?.user?.id} />;
}

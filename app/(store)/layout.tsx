import { auth } from "@/lib/auth";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { PageTransition } from "@/components/ui/page-transition";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user;

  return (
    <div className="min-h-screen flex flex-col bg-void-black">
      <Navbar
        userName={user?.name ?? user?.email ?? undefined}
        isPro={user?.isPro ?? false}
        isAdmin={user?.role === "ADMIN"}
      />
      <main className="flex-1">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
    </div>
  );
}

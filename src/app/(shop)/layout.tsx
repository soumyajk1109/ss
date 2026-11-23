import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { storefront } from "@/content/storefront";
import { brand } from "@/lib/brand";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <p className="bg-charcoal px-4 py-2 text-center text-[11px] font-medium tracking-wide text-rcs-gold">
        {storefront.announcement}
      </p>
      <Header phone={brand.phone} />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <Footer />
      <MobileTabBar />
    </div>
  );
}

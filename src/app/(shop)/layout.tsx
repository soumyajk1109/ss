import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { brand } from "@/lib/brand";
import { getNavTree } from "@/lib/catalog";
import { paymentsMode } from "@/lib/payments-mode";
import type { NavDepartment } from "@/lib/types";
import { formatInr } from "@/lib/utils";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  let nav: NavDepartment[] = [
    { name: "Men", slug: "men", categories: [] },
    { name: "Women", slug: "women", categories: [] },
    { name: "Kids", slug: "kids", categories: [] },
  ];
  try {
    const tree = await getNavTree();
    if (tree.length) nav = tree;
  } catch {
    /* header still renders the three departments */
  }
  const demo = paymentsMode() === "demo";
  const otpDebug = process.env.OTP_DEBUG === "true";

  return (
    <div className="flex min-h-screen flex-col">
      <p className="bg-botanical px-4 py-2 text-center text-[11px] uppercase tracking-[0.18em] text-paper">
        Inclusive of GST · Free shipping over {formatInr(brand.freeShippingOverInr)} · COD with OTP
      </p>
      {demo || otpDebug ? (
        <p className="bg-turmeric/40 px-4 py-2 text-center text-xs text-charcoal">
          {demo ? "Demo payments are on, so checkout can simulate a capture. " : ""}
          {otpDebug ? "OTP debug is on. Codes appear in the response. Turn this off before production." : ""}
        </p>
      ) : null}
      <Header nav={nav} />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <Footer />
      <MobileTabBar />
    </div>
  );
}

import { Textile } from "@/components/shop/Textile";
import { storefront } from "@/content/storefront";

export default function HomePage() {
  return (
    <div className="bg-paper">
      <section className="px-3 pt-3 md:px-5">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[1.6rem] bg-turmeric-light text-charcoal">
          <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 92% 18%, #E5A93B55 0 80px, transparent 81px)" }} />
          <div className="relative px-6 py-10 md:px-12 md:py-16">
            <p className="text-xs uppercase tracking-[0.28em] text-rcs-red">{storefront.hero.kicker}</p>
            <h1 className="mt-3 max-w-3xl font-hero text-[2.65rem] font-medium leading-[0.92] tracking-[-0.03em] text-rcs-red md:text-7xl">{storefront.hero.title}</h1>
            <p className="mt-4 max-w-md text-lg italic text-rcs-red">{storefront.hero.line}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-8 text-center">
        <p className="whitespace-pre-line text-sm leading-7 text-black">{storefront.about}</p>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-10">
        <h2 className="font-display text-3xl">
          Collections
        </h2>
        <ul className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
          {storefront.collections.map((item) => (
            <li key={item.slug}>
              <div className="overflow-hidden rounded-2xl">
                <Textile hex={item.hex} label={item.name} patternKey={item.slug} image={"image" in item ? item.image : undefined} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section id="visit" className="border-t border-line">
        <ul className="mx-auto grid max-w-6xl gap-3 px-5 py-8 sm:grid-cols-3">
          {storefront.visit.map((item) => (
            <li key={item} className="text-sm font-medium">
              {item}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

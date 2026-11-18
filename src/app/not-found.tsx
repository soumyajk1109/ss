import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-5 py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-3 font-display text-5xl">That piece is not on the rail.</h1>
      <Link href="/shop" className="btn-botanical mt-6">
        Back to the shop
      </Link>
    </div>
  );
}

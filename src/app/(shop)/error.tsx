"use client";

export default function ShopError({ error, reset }: { error: Error; reset: () => void }) {
  const message = process.env.NODE_ENV === "development" ? error.message : "Please try again in a moment.";
  return (
    <div className="mx-auto max-w-lg px-5 py-24 text-center">
      <p className="eyebrow">Something snagged</p>
      <h1 className="mt-3 font-display text-4xl">This page did not load.</h1>
      <p className="mt-3 text-sm text-clay">{message}</p>
      <button type="button" className="btn-botanical mt-6" onClick={reset}>
        Try again
      </button>
    </div>
  );
}

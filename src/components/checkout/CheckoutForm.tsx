"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { emitCartChange } from "@/lib/cart-events";
import type { CartLine, PaymentMethod } from "@/lib/types";
import { formatInr } from "@/lib/utils";

type Service = {
  serviceable: boolean;
  error?: string;
  city?: string;
  state?: string;
  shippingInr?: number;
  codAvailable?: boolean;
  etaMinDays?: number;
  etaMaxDays?: number;
};

type Started = {
  kind: "cod" | "demo" | "razorpay";
  orderNumber: string;
  accessToken: string;
  totalInr: number;
  amountPaise: number;
  keyId?: string;
  razorpayOrderId?: string | null;
  devCode?: string;
  otpError?: string;
};

export function CheckoutForm({
  lines,
  subtotal,
  email,
  freeShippingOverInr,
  codFeeInr,
}: {
  lines: CartLine[];
  subtotal: number;
  email?: string | null;
  freeShippingOverInr: number;
  codFeeInr: number;
}) {
  const router = useRouter();
  const [method, setMethod] = useState<PaymentMethod>("RAZORPAY");
  const [service, setService] = useState<Service | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [started, setStarted] = useState<Started | null>(null);
  const [code, setCode] = useState("");

  const blocked = lines.some((line) => !line.published || line.quantity > line.available);
  const shipping = service?.serviceable ? (subtotal >= freeShippingOverInr ? 0 : service.shippingInr ?? 0) : null;
  const codFee = method === "COD" ? codFeeInr : 0;
  const total = shipping == null ? null : subtotal + shipping + codFee;

  async function onPincode(value: string) {
    if (!/^[1-9][0-9]{5}$/.test(value)) {
      setService(null);
      return;
    }
    const res = await fetch(`/api/pincode?code=${value}`);
    setService((await res.json()) as Service);
  }

  async function place(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    setPending(true);
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        method,
        email: String(form.get("email") ?? ""),
        address: {
          name: String(form.get("name") ?? ""),
          phone: String(form.get("phone") ?? ""),
          line1: String(form.get("line1") ?? ""),
          line2: String(form.get("line2") ?? ""),
          city: String(form.get("city") ?? ""),
          state: service?.state || String(form.get("state") ?? ""),
          pincode: String(form.get("pincode") ?? ""),
        },
      }),
    });
    const data = (await res.json()) as Started & { error?: string };
    setPending(false);
    if (!res.ok) {
      setError(data.error ?? "Checkout did not start.");
      return;
    }
    emitCartChange();
    setStarted(data);
    if (data.kind === "razorpay") await openRazorpay(data);
  }

  async function openRazorpay(data: Started) {
    const loaded = await loadRazorpay();
    if (!loaded || !window.Razorpay || !data.keyId || !data.razorpayOrderId) {
      setError("Razorpay Checkout did not load.");
      return;
    }
    const checkout = new window.Razorpay({
      key: data.keyId,
      amount: data.amountPaise,
      currency: "INR",
      name: "SS",
      description: data.orderNumber,
      order_id: data.razorpayOrderId,
      prefill: {},
      theme: { color: "#1B4D3E" },
      config: {
        display: {
          blocks: {
            methods: {
              name: "Pay SS",
              instruments: [
                { method: "upi" },
                { method: "card" },
                { method: "netbanking" },
                { method: "wallet" },
                { method: "emi" },
                { method: "paylater" },
              ],
            },
          },
          sequence: ["block.methods"],
          preferences: { show_default_blocks: false },
        },
      },
      handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        const verified = await fetch("/api/checkout/verify", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            orderNumber: data.orderNumber,
            accessToken: data.accessToken,
            ...response,
          }),
        });
        if (!verified.ok) {
          const body = (await verified.json()) as { error?: string };
          setError(body.error ?? "Payment reached us, but stock confirmation failed. Keep this page.");
          return;
        }
        router.push(`/orders/${data.orderNumber}?t=${data.accessToken}`);
      },
    });
    checkout.open();
  }

  async function simulate() {
    if (!started) return;
    setPending(true);
    const res = await fetch("/api/checkout/simulate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ orderNumber: started.orderNumber, accessToken: started.accessToken }),
    });
    setPending(false);
    if (!res.ok) {
      const body = (await res.json()) as { error?: string };
      setError(body.error ?? "Demo capture failed.");
      return;
    }
    router.push(`/orders/${started.orderNumber}?t=${started.accessToken}`);
  }

  async function verifyCod() {
    if (!started) return;
    setPending(true);
    const res = await fetch("/api/checkout/cod", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        orderNumber: started.orderNumber,
        accessToken: started.accessToken,
        action: "verify",
        code,
      }),
    });
    const body = (await res.json()) as { error?: string };
    setPending(false);
    if (!res.ok) {
      setError(body.error ?? "That code did not confirm the order.");
      return;
    }
    router.push(`/orders/${started.orderNumber}?t=${started.accessToken}`);
  }

  if (started?.kind === "cod") {
    return (
      <section className="rounded-3xl border border-line bg-white p-5">
        <p className="eyebrow">Cash on delivery</p>
        <h2 className="mt-2 font-display text-4xl">Enter the code sent to your phone.</h2>
        <p className="mt-2 text-sm text-clay">Order {started.orderNumber}. The size stays on hold for 15 minutes.</p>
        {started.devCode ? <p className="mt-3 rounded-2xl bg-turmeric/40 px-3 py-2 text-sm">Local OTP: {started.devCode}</p> : null}
        {started.otpError ? <p className="mt-3 text-sm">{started.otpError}</p> : null}
        <input className="field mt-4 tracking-[0.3em]" inputMode="numeric" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} aria-label="Delivery code" />
        {error ? <p className="mt-3 text-sm">{error}</p> : null}
        <button type="button" className="btn-botanical mt-4 w-full" disabled={pending || code.length !== 6} onClick={() => void verifyCod()}>
          Confirm cash on delivery
        </button>
      </section>
    );
  }

  if (started?.kind === "demo") {
    return (
      <section className="rounded-3xl border border-line bg-white p-5">
        <p className="eyebrow">Demo payment</p>
        <h2 className="mt-2 font-display text-4xl">Simulate a captured payment.</h2>
        <p className="mt-2 text-sm text-clay">
          Order {started.orderNumber} · {formatInr(started.totalInr)}. No Razorpay keys are configured, so this marks the order paid and sells the reserved stock.
        </p>
        {error ? <p className="mt-3 text-sm">{error}</p> : null}
        <button type="button" className="btn-turmeric mt-4 w-full" disabled={pending} onClick={() => void simulate()}>
          Simulate payment captured
        </button>
      </section>
    );
  }

  return (
    <form onSubmit={place} className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-4">
        <div>
          <p className="eyebrow">Delivery</p>
          <h1 className="mt-2 font-display text-5xl">Where should it land?</h1>
        </div>
        <input name="name" required placeholder="Full name" className="field" />
        <input name="phone" required placeholder="Mobile" className="field" inputMode="tel" />
        <input name="email" type="email" defaultValue={email ?? ""} placeholder="Email for the invoice" className="field" />
        <input name="line1" required placeholder="Address line" className="field" />
        <input name="line2" placeholder="Landmark, optional" className="field" />
        <div className="grid grid-cols-2 gap-3">
          <input name="city" required placeholder="City" className="field" />
          <input name="state" required placeholder="State" defaultValue={service?.state ?? ""} key={service?.state ?? "state"} className="field" />
        </div>
        <input
          name="pincode"
          required
          inputMode="numeric"
          maxLength={6}
          placeholder="Pincode"
          className="field"
          onChange={(event) => void onPincode(event.target.value.replace(/\D/g, "").slice(0, 6))}
        />
        <p className="text-sm text-clay" aria-live="polite">
          {service?.serviceable
            ? `${service.city}, ${service.state} · ${service.etaMinDays}–${service.etaMaxDays} days${service.codAvailable ? " · COD available" : ""}`
            : service?.error || "We deliver to seven metros. Try 400001 or 560001."}
        </p>
        <fieldset className="grid gap-2">
          <legend className="eyebrow">Payment</legend>
          <label className="mt-2 flex items-start gap-3 rounded-2xl border border-line bg-white p-4">
            <input type="radio" name="method" checked={method === "RAZORPAY"} onChange={() => setMethod("RAZORPAY")} />
            <span>
              <span className="block font-medium">UPI, cards, net banking, wallets, EMI</span>
              <span className="text-sm text-clay">Razorpay Checkout. The size is held until the payment is captured.</span>
            </span>
          </label>
          <label className="flex items-start gap-3 rounded-2xl border border-line bg-white p-4">
            <input type="radio" name="method" checked={method === "COD"} onChange={() => setMethod("COD")} disabled={service?.serviceable === true && service.codAvailable === false} />
            <span>
              <span className="block font-medium">Cash on delivery · {formatInr(codFeeInr)}</span>
              <span className="text-sm text-clay">A 6-digit code confirms the order and sells the reserved stock.</span>
            </span>
          </label>
        </fieldset>
        {error ? <p className="text-sm">{error}</p> : null}
        <button className="btn-botanical w-full" disabled={pending || blocked || !service?.serviceable}>
          {pending ? "Holding your size…" : "Place order"}
        </button>
        {blocked ? <p className="text-sm">A piece in the bag is no longer available in that quantity.</p> : null}
      </div>
      <aside className="h-fit rounded-3xl border border-line bg-white p-5">
        <p className="eyebrow">To pay</p>
        <ul className="mt-4 space-y-3 text-sm">
          {lines.map((line) => (
            <li key={line.variantId} className="flex justify-between gap-3">
              <span>
                {line.title}
                <span className="block text-xs text-clay">
                  {line.sizeValue} / {line.colorName} × {line.quantity}
                </span>
              </span>
              <span>{formatInr(line.lineTotalInr)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between"><dt>Merchandise</dt><dd>{formatInr(subtotal)}</dd></div>
          <div className="flex justify-between"><dt>Shipping</dt><dd>{shipping == null ? "—" : shipping === 0 ? "Free" : formatInr(shipping)}</dd></div>
          {method === "COD" ? <div className="flex justify-between"><dt>COD fee</dt><dd>{formatInr(codFee)}</dd></div> : null}
          <div className="flex justify-between font-medium"><dt>Total</dt><dd>{total == null ? "—" : formatInr(total)}</dd></div>
        </dl>
        <p className="mt-3 text-xs leading-5 text-clay">Inside Maharashtra this splits into CGST and SGST. Other states are IGST. The tax invoice uses the pincode state.</p>
      </aside>
    </form>
  );
}

function loadRazorpay() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

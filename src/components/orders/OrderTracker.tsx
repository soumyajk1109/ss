"use client";

import { useState } from "react";
import type { OrderStatus, PaymentMethod } from "@/lib/types";
import { formatInr, formatWhen } from "@/lib/utils";

type OrderView = {
  orderNumber: string;
  accessToken: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
  totalInr: number;
  subtotalInr: number;
  shippingInr: number;
  codFeeInr: number;
  cgstInr: number;
  sgstInr: number;
  igstInr: number;
  reservationExpiresAt: string;
  createdAt: string;
  placeOfSupply: string;
  shippingAddress: { name: string; line1: string; line2?: string; city: string; state: string; pincode: string; phone: string };
  items: { productTitle: string; sku: string; sizeValue: string; colorName: string; quantity: number; lineTotalInr: number }[];
};

const STEPS = ["CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"] as const;

export function OrderTracker({ order, demo }: { order: OrderView; demo: boolean }) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [code, setCode] = useState("");
  const step = STEPS.indexOf(order.status as (typeof STEPS)[number]);

  async function pay() {
    setPending(true);
    setError("");
    const res = await fetch("/api/checkout/retry", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ orderNumber: order.orderNumber, accessToken: order.accessToken }),
    });
    const data = (await res.json()) as { error?: string; kind?: string };
    setPending(false);
    if (!res.ok) {
      setError(data.error ?? "The hold has ended.");
      return;
    }
    if (data.kind === "demo") {
      const sim = await fetch("/api/checkout/simulate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderNumber: order.orderNumber, accessToken: order.accessToken }),
      });
      if (!sim.ok) {
        setError("Demo capture failed.");
        return;
      }
      window.location.reload();
    } else {
      setError("Reopen checkout from a browser with Razorpay, or pay from the original window.");
    }
  }

  async function verifyCod() {
    setPending(true);
    const res = await fetch("/api/checkout/cod", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ orderNumber: order.orderNumber, accessToken: order.accessToken, action: "verify", code }),
    });
    const data = (await res.json()) as { error?: string };
    setPending(false);
    if (!res.ok) {
      setError(data.error ?? "Code not accepted.");
      return;
    }
    window.location.reload();
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <p className="eyebrow">{order.orderNumber}</p>
      <h1 className="mt-2 font-display text-5xl">{headline(order.status)}</h1>
      <p className="mt-3 text-sm text-clay">Placed {formatWhen(order.createdAt)} · {order.placeOfSupply}</p>

      {order.status === "RESERVED" || order.status === "COD_PENDING" ? (
        <p className="mt-4 rounded-2xl bg-turmeric/30 px-4 py-3 text-sm">
          Size hold until {formatWhen(order.reservationExpiresAt)}.
        </p>
      ) : null}
      {order.status === "EXPIRED" || order.status === "CANCELLED" || order.status === "RETURNED" ? (
        <p className="mt-4 rounded-2xl border border-line px-4 py-3 text-sm">This order is {order.status.toLowerCase()}.</p>
      ) : null}

      <ol className="mt-8 grid grid-cols-4 gap-2 text-center text-[11px] uppercase tracking-[0.14em]">
        {STEPS.map((name, index) => (
          <li key={name} className={step >= index ? "text-botanical" : "text-clay"}>
            <span className={`mx-auto mb-2 block h-1 ${step >= index ? "bg-botanical" : "bg-line"}`} />
            {name.toLowerCase()}
          </li>
        ))}
      </ol>

      {order.status === "RESERVED" ? (
        <button type="button" className="btn-turmeric mt-6" disabled={pending} onClick={() => void pay()}>
          {demo ? "Simulate payment" : "Continue payment"}
        </button>
      ) : null}
      {order.status === "COD_PENDING" ? (
        <div className="mt-6 flex gap-2">
          <input className="field max-w-40 tracking-[0.3em]" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} aria-label="COD code" />
          <button type="button" className="btn-botanical" disabled={pending || code.length !== 6} onClick={() => void verifyCod()}>
            Confirm
          </button>
        </div>
      ) : null}
      {error ? <p className="mt-3 text-sm">{error}</p> : null}

      <ul className="mt-10 divide-y divide-line">
        {order.items.map((item) => (
          <li key={item.sku} className="flex justify-between gap-4 py-4 text-sm">
            <span>
              {item.productTitle}
              <span className="block text-clay">{item.colorName} · {item.sizeValue} · {item.sku} × {item.quantity}</span>
            </span>
            <span>{formatInr(item.lineTotalInr)}</span>
          </li>
        ))}
      </ul>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between"><dt>Merchandise</dt><dd>{formatInr(order.subtotalInr)}</dd></div>
        <div className="flex justify-between"><dt>Shipping</dt><dd>{order.shippingInr ? formatInr(order.shippingInr) : "Free"}</dd></div>
        {order.codFeeInr ? <div className="flex justify-between"><dt>COD fee</dt><dd>{formatInr(order.codFeeInr)}</dd></div> : null}
        <div className="flex justify-between"><dt>{order.igstInr ? "IGST" : "CGST + SGST"}</dt><dd>{formatInr(order.igstInr || order.cgstInr + order.sgstInr)}</dd></div>
        <div className="flex justify-between font-medium"><dt>Total</dt><dd>{formatInr(order.totalInr)}</dd></div>
      </dl>
      <p className="mt-6 text-sm text-clay">
        {order.shippingAddress.name}, {order.shippingAddress.line1}, {order.shippingAddress.city} {order.shippingAddress.pincode}
      </p>
    </div>
  );
}

function headline(status: OrderStatus) {
  if (status === "RESERVED") return "Payment is still open.";
  if (status === "COD_PENDING") return "Confirm cash on delivery.";
  if (status === "CONFIRMED") return "We have the order.";
  if (status === "PACKED") return "Packed in Kalbadevi.";
  if (status === "SHIPPED") return "On the way.";
  if (status === "DELIVERED") return "Delivered.";
  if (status === "CANCELLED") return "Cancelled.";
  if (status === "EXPIRED") return "The hold expired.";
  return "Returned.";
}

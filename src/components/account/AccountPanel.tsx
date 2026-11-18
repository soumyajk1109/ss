"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function AccountPanel({ next }: { next: string }) {
  const router = useRouter();
  const [destination, setDestination] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function requestCode(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    const res = await fetch("/api/auth/otp/request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ destination }),
    });
    const data = (await res.json()) as { error?: string; devCode?: string };
    setPending(false);
    if (!res.ok) {
      setError(data.error ?? "Could not send a code.");
      return;
    }
    setSent(true);
    setDevCode(data.devCode ?? "");
  }

  async function verify(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    const result = await signIn("otp", { destination, code, redirect: false });
    setPending(false);
    if (result?.error) {
      setError("That code did not sign you in.");
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <p className="eyebrow">Account</p>
      <h1 className="mt-2 font-display text-5xl">Sign in with a code.</h1>
      <p className="mt-3 text-sm leading-6 text-clay">Email or an Indian mobile number. New shoppers get a customer account. Staff roles are assigned in the database, not from this form.</p>
      {!sent ? (
        <form onSubmit={requestCode} className="mt-6 space-y-3">
          <input className="field" required value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="Mobile or email" />
          {error ? <p className="text-sm">{error}</p> : null}
          <button className="btn-botanical w-full" disabled={pending}>Send code</button>
        </form>
      ) : (
        <form onSubmit={verify} className="mt-6 space-y-3">
          {devCode ? <p className="rounded-2xl bg-turmeric/40 px-3 py-2 text-sm">Local OTP: {devCode}</p> : null}
          <input className="field tracking-[0.3em]" inputMode="numeric" required value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6-digit code" />
          {error ? <p className="text-sm">{error}</p> : null}
          <button className="btn-botanical w-full" disabled={pending || code.length !== 6}>Sign in</button>
          <button type="button" className="text-sm underline" onClick={() => setSent(false)}>Use a different email or number</button>
        </form>
      )}
    </div>
  );
}

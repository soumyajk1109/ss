"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";

type Option = { departmentSlug: string; departmentName: string; slug: string; name: string };

type VariantDraft = {
  sku: string;
  sizeType: "ALPHA" | "NUMERIC" | "KIDS_AGE";
  sizeValue: string;
  colorName: string;
  colorHex: string;
  mrpInr: number;
  sellingPriceInr: number;
  stockQuantity: number;
};

const emptyVariant = (): VariantDraft => ({
  sku: "",
  sizeType: "ALPHA",
  sizeValue: "M",
  colorName: "Ivory",
  colorHex: "#F3EDE2",
  mrpInr: 1990,
  sellingPriceInr: 1490,
  stockQuantity: 10,
});

export function ProductForm({ options }: { options: Option[] }) {
  const router = useRouter();
  const departments = useMemo(() => [...new Map(options.map((option) => [option.departmentSlug, option.departmentName])).entries()], [options]);
  const [department, setDepartment] = useState(departments[0]?.[0] ?? "men");
  const cats = options.filter((option) => option.departmentSlug === department);
  const [variants, setVariants] = useState<VariantDraft[]>([emptyVariant()]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: String(form.get("title") ?? ""),
        description: String(form.get("description") ?? ""),
        departmentSlug: department,
        categorySlug: String(form.get("categorySlug") ?? ""),
        hsnCode: String(form.get("hsnCode") ?? ""),
        gstRate: Number(form.get("gstRate")),
        attributes: {
          fabric: String(form.get("fabric") ?? ""),
          fit: String(form.get("fit") ?? ""),
          occasion: String(form.get("occasion") ?? ""),
          wash_care: String(form.get("wash_care") ?? ""),
          age_group: String(form.get("age_group") ?? ""),
        },
        variants,
      }),
    });
    const data = (await res.json()) as { error?: string };
    setPending(false);
    if (!res.ok) {
      setError(data.error ?? "Could not create the product.");
      return;
    }
    router.refresh();
    event.currentTarget.reset();
    setVariants([emptyVariant()]);
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-3xl border border-line bg-white p-5">
      <p className="eyebrow">New piece</p>
      <input name="title" required placeholder="Title" className="field" />
      <textarea name="description" required minLength={10} placeholder="Description" className="field min-h-24" />
      <div className="grid gap-3 md:grid-cols-2">
        <select className="field" value={department} onChange={(event) => setDepartment(event.target.value)}>
          {departments.map(([slug, name]) => (
            <option key={slug} value={slug}>{name}</option>
          ))}
        </select>
        <select name="categorySlug" className="field">
          {cats.map((category) => (
            <option key={`${category.departmentSlug}-${category.slug}`} value={category.slug}>{category.name}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input name="hsnCode" required placeholder="HSN" className="field" defaultValue="6204" />
        <input name="gstRate" required type="number" placeholder="GST %" className="field" defaultValue={12} />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <input name="fabric" placeholder="Fabric" className="field" />
        <input name="fit" placeholder="Fit" className="field" />
        <input name="occasion" placeholder="Occasion" className="field" />
        <input name="wash_care" placeholder="Wash care" className="field" />
        <input name="age_group" placeholder="Age group, for kids" className="field" />
      </div>
      <div className="space-y-3">
        {variants.map((variant, index) => (
          <div key={index} className="grid gap-2 rounded-2xl border border-line p-3 md:grid-cols-4">
            <input className="field" placeholder="SKU" value={variant.sku} onChange={(event) => edit(index, { sku: event.target.value })} />
            <select className="field" value={variant.sizeType} onChange={(event) => edit(index, { sizeType: event.target.value as VariantDraft["sizeType"] })}>
              <option value="ALPHA">Alpha</option>
              <option value="NUMERIC">Numeric</option>
              <option value="KIDS_AGE">Kids age</option>
            </select>
            <input className="field" placeholder="Size" value={variant.sizeValue} onChange={(event) => edit(index, { sizeValue: event.target.value })} />
            <input className="field" placeholder="Colour" value={variant.colorName} onChange={(event) => edit(index, { colorName: event.target.value })} />
            <input className="field" placeholder="#hex" value={variant.colorHex} onChange={(event) => edit(index, { colorHex: event.target.value })} />
            <input className="field" type="number" value={variant.mrpInr} onChange={(event) => edit(index, { mrpInr: Number(event.target.value) })} />
            <input className="field" type="number" value={variant.sellingPriceInr} onChange={(event) => edit(index, { sellingPriceInr: Number(event.target.value) })} />
            <input className="field" type="number" value={variant.stockQuantity} onChange={(event) => edit(index, { stockQuantity: Number(event.target.value) })} />
          </div>
        ))}
        <button type="button" className="text-sm underline" onClick={() => setVariants((rows) => [...rows, emptyVariant()])}>
          Add a SKU
        </button>
      </div>
      {error ? <p className="text-sm">{error}</p> : null}
      <button className="btn-botanical" disabled={pending}>Create product</button>
    </form>
  );

  function edit(index: number, patch: Partial<VariantDraft>) {
    setVariants((rows) => rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
  }
}

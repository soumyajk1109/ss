"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { sizeGuideFor } from "@/lib/size-guide";
import type { SizeType } from "@/lib/types";

export function SizeGuide({
  open,
  onClose,
  department,
  sizeType,
}: {
  open: boolean;
  onClose: () => void;
  department: string;
  sizeType: SizeType;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const guide = sizeGuideFor(department, sizeType);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className="w-[min(100%,40rem)] rounded-3xl bg-paper p-0 text-charcoal backdrop:bg-charcoal/50"
    >
      <div className="flex items-start justify-between gap-4 px-5 py-5 md:px-7">
        <div>
          <p className="eyebrow">Size guide</p>
          <h2 className="mt-1 font-display text-3xl">{guide.title}</h2>
        </div>
        <button type="button" onClick={onClose} aria-label="Close size guide">
          <X />
        </button>
      </div>
      <div className="overflow-auto px-5 pb-6 md:px-7">
        <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-line text-[11px] uppercase tracking-[0.16em] text-clay">
              {guide.columns.map((column) => (
                <th key={column} className="py-2 pr-4 font-medium">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {guide.rows.map((row) => (
              <tr key={row.join("-")} className="border-b border-line/80">
                {row.map((cell) => (
                  <td key={cell} className="py-3 pr-4">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-4 text-sm leading-6 text-clay">{guide.note}</p>
      </div>
    </dialog>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function PublishToggle({ id, published }: { id: string; published: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      className="text-sm underline"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await fetch("/api/admin/products", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id, isPublished: !published }),
        });
        setPending(false);
        router.refresh();
      }}
    >
      {published ? "Unpublish" : "Publish"}
    </button>
  );
}

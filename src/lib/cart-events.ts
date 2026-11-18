export function emitCartChange() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("ss-cart"));
}

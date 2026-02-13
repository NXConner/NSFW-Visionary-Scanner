export async function generateDeviceFingerprint(): Promise<string> {
  const components: string[] = [];

  if (typeof window !== "undefined") {
    components.push(`screen:${screen.width}x${screen.height}x${screen.colorDepth}`);
    components.push(`timezone:${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
    components.push(`language:${navigator.language}`);
    components.push(`platform:${navigator.platform}`);
    components.push(`cores:${navigator.hardwareConcurrency || "unknown"}`);

    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.textBaseline = "top";
        ctx.font = "14px Arial";
        ctx.fillText("DLC Auth", 2, 2);
        components.push(`canvas:${canvas.toDataURL().slice(-50)}`);
      }
    } catch {
      // blocked
    }
  }

  const data = components.join("|");
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(data));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

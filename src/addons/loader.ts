import { registerAddonModule, setAddonContributions, setAddonRuntimeStatus } from "./registry";
import type { AddonModule, AddonRegisterContext } from "./types";
import { dlcRegistry } from "@/dlc/core/DLCRegistry";
import { registerDlcModules } from "@/dlc/modules";
import { evaluateAddonCompatibility, getAppRuntimeInfo } from "./compatibility";

let bootstrapped = false;

function collectAddonModules(): AddonModule[] {
  // Vite will eagerly include these at build-time; this is “dynamic” in that new addons
  // can be dropped in without touching a central index file.
  const modules = import.meta.glob("./**/addon.ts", { eager: true }) as Record<
    string,
    { default?: AddonModule; addon?: AddonModule }
  >;

  const out: AddonModule[] = [];
  for (const m of Object.values(modules)) {
    const mod = m.default ?? m.addon;
    if (mod) out.push(mod);
  }
  return out;
}

export function bootstrapAddons(): void {
  if (bootstrapped) return;
  bootstrapped = true;

  const addonModules = collectAddonModules();
  addonModules.forEach(registerAddonModule);
  const runtimeInfo = getAppRuntimeInfo();

  const ctx: AddonRegisterContext = {
    dlc: {
      registerPackages: pkgs => dlcRegistry.registerPackages(pkgs),
      registerManifests: manifests => dlcRegistry.registerManifests(manifests),
      registerModules: mods => registerDlcModules(mods),
    },
  };

  for (const addon of addonModules) {
    const compatibility = evaluateAddonCompatibility(addon.manifest, runtimeInfo);
    if (compatibility.status === "incompatible") {
      setAddonRuntimeStatus(addon.manifest.id, {
        status: "blocked",
        lastError: compatibility.reasons.join("; ") || "Addon blocked by compatibility rules",
      });
      continue;
    }
    try {
      setAddonRuntimeStatus(addon.manifest.id, { status: "registering", lastError: null });
      const res = addon.register(ctx);
      if (res && typeof (res as Promise<unknown>).then === "function") {
        (res as Promise<any>)
          .then(r => setAddonContributions(addon.manifest.id, r?.contributions))
          .catch(e => {
            setAddonRuntimeStatus(addon.manifest.id, {
              status: "failed",
              lastError: e instanceof Error ? e.message : "Addon register failed",
            });
          });
      } else {
        setAddonContributions(addon.manifest.id, (res as any)?.contributions);
      }
    } catch (e) {
      // Never block boot on addon failures.
      setAddonRuntimeStatus(addon.manifest.id, {
        status: "failed",
        lastError: e instanceof Error ? e.message : "Addon register failed",
      });
    }
  }
}

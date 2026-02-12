type BootDiagApi = {
  hideLoader?: () => void;
  showPanel?: () => void;
};

function getBootDiag(): BootDiagApi | null {
  try {
    const w = window as unknown as { __BOOT_DIAG__?: BootDiagApi };
    return w.__BOOT_DIAG__ ?? null;
  } catch {
    return null;
  }
}

export function markAppInteractive(): void {
  try {
    window.__APP_INTERACTIVE__ = true;
  } catch {
    // ignore
  }
}

/**
 * Hide/remove the static HTML loader (index.html) once React UI is available.
 * Safe to call multiple times.
 */
export function hideStaticAppLoader(): void {
  try {
    const loader = document.getElementById("app-loader");
    if (loader) {
      loader.classList.add("fade-out");
      window.setTimeout(() => {
        try {
          loader.remove();
        } catch {
          // ignore
        }
      }, 350);
    }
  } catch {
    // ignore
  }

  try {
    const bootDiag = getBootDiag();
    if (bootDiag && typeof bootDiag.hideLoader === "function") {
      bootDiag.hideLoader();
    }
  } catch {
    // ignore
  }
}

export function markAppInteractiveAndHideStaticLoader(): void {
  markAppInteractive();
  hideStaticAppLoader();
}

export function showBootDiagnosticsPanel(): void {
  try {
    const bootDiag = getBootDiag();
    if (bootDiag && typeof bootDiag.showPanel === "function") {
      bootDiag.showPanel();
    }
  } catch {
    // ignore
  }
}


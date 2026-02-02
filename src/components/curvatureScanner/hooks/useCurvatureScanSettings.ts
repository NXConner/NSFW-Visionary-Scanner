import * as React from "react";

import { loadCurvatureSettings, saveCurvatureSettings } from "@/scanner/curvature/settings";

export function useCurvatureScanSettings() {
  const [loaded, setLoaded] = React.useState(false);
  const [storeAnnotatedImages, setStoreAnnotatedImages] = React.useState(false);
  const [flipTopViewLeftRight, setFlipTopViewLeftRight] = React.useState(false);
  const [flipSideViewDorsalVentral, setFlipSideViewDorsalVentral] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const s = await loadCurvatureSettings();
      setStoreAnnotatedImages(Boolean(s.storeAnnotatedImages));
      setFlipTopViewLeftRight(Boolean(s.flipTopViewLeftRight));
      setFlipSideViewDorsalVentral(Boolean(s.flipSideViewDorsalVentral));
      setLoaded(true);
    })();
  }, []);

  const persist = React.useCallback(
    async (next: {
      storeAnnotatedImages?: boolean;
      flipTopViewLeftRight?: boolean;
      flipSideViewDorsalVentral?: boolean;
    }) => {
      const settings = {
        storeAnnotatedImages: next.storeAnnotatedImages ?? storeAnnotatedImages,
        flipTopViewLeftRight: next.flipTopViewLeftRight ?? flipTopViewLeftRight,
        flipSideViewDorsalVentral: next.flipSideViewDorsalVentral ?? flipSideViewDorsalVentral,
      };
      await saveCurvatureSettings(settings);
    },
    [flipSideViewDorsalVentral, flipTopViewLeftRight, storeAnnotatedImages],
  );

  return {
    loaded,
    storeAnnotatedImages,
    flipTopViewLeftRight,
    flipSideViewDorsalVentral,
    setStoreAnnotatedImages: async (v: boolean) => {
      setStoreAnnotatedImages(v);
      await persist({ storeAnnotatedImages: v });
    },
    setFlipTopViewLeftRight: async (v: boolean) => {
      setFlipTopViewLeftRight(v);
      await persist({ flipTopViewLeftRight: v });
    },
    setFlipSideViewDorsalVentral: async (v: boolean) => {
      setFlipSideViewDorsalVentral(v);
      await persist({ flipSideViewDorsalVentral: v });
    },
  };
}


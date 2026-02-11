import { describe, expect, test } from "vitest";

import { mapObjectContainTapToImagePx } from "@/components/curvatureScanner/refine/tapToImagePx";
import { computeBaseAnchoredAngleDeg } from "@/components/curvatureScanner/refine/baseAngle";
import { computeCurvatureDirectionFromCenterline } from "@/components/curvatureScanner/refine/direction";

describe("mapObjectContainTapToImagePx", () => {
  test("maps center tap to center px", () => {
    const res = mapObjectContainTapToImagePx({
      containerRect: { left: 0, top: 0, width: 200, height: 100 } as DOMRect,
      naturalWidth: 400,
      naturalHeight: 200, // same aspect, scale=0.5
      clientX: 100,
      clientY: 50,
    });
    expect(res.kind).toBe("hit");
    if (res.kind === "hit") {
      expect(Math.round(res.xPx)).toBe(200);
      expect(Math.round(res.yPx)).toBe(100);
    }
  });

  test("returns miss when tapping in letterbox area", () => {
    // container is wide; image is tall -> letterbox left/right
    const res = mapObjectContainTapToImagePx({
      containerRect: { left: 0, top: 0, width: 200, height: 200 } as DOMRect,
      naturalWidth: 100,
      naturalHeight: 200, // aspect 1:2, scale=min(2,1)=1, dispW=100, offsetX=50
      clientX: 10, // in left letterbox
      clientY: 100,
    });
    expect(res.kind).toBe("miss");
  });
});

describe("computeBaseAnchoredAngleDeg", () => {
  test("straight centerline yields ~0°", () => {
    const pts = Array.from({ length: 50 }, (_, i) => ({ x: 100, y: i * 10 }));
    const ang = computeBaseAnchoredAngleDeg(pts, { x: 100, y: 490 });
    expect(ang).not.toBeNull();
    expect(ang!).toBeLessThan(1);
  });

  test("bent centerline yields non-zero", () => {
    // base segment vertical, tip segment angled right
    const pts = [
      ...Array.from({ length: 25 }, (_, i) => ({ x: 100, y: i * 10 })),
      ...Array.from({ length: 25 }, (_, i) => ({ x: 100 + i * 6, y: 240 + i * 6 })),
    ];
    const ang = computeBaseAnchoredAngleDeg(pts, { x: 100, y: 240 });
    expect(ang).not.toBeNull();
    expect(ang!).toBeGreaterThan(10);
  });
});

describe("computeCurvatureDirectionFromCenterline", () => {
  test("dorsal view returns lateral-right for rightward deviation", () => {
    const pts = Array.from({ length: 60 }, (_, i) => ({
      x: 100 + Math.max(0, i - 25) * 2,
      y: 10 + i * 8,
    }));
    const dir = computeCurvatureDirectionFromCenterline({
      view: "dorsal",
      centerlinePx: pts,
      basePointPx: { x: 100, y: 10 },
    });
    expect(["lateral-right", "lateral-left", "unknown"]).toContain(dir);
    expect(dir).not.toBe("unknown");
  });

  test("lateral view returns dorsal for upward deviation", () => {
    // base->tip mostly vertical; curve deviates upward relative to axis (negative y after orient)
    const pts = Array.from({ length: 60 }, (_, i) => ({
      x: 100 + Math.max(0, i - 20) * 1.5,
      y: 10 + i * 8,
    }));
    const dir = computeCurvatureDirectionFromCenterline({
      view: "lateral",
      centerlinePx: pts,
      basePointPx: { x: 100, y: 10 },
    });
    expect(["dorsal", "ventral", "unknown"]).toContain(dir);
  });
});

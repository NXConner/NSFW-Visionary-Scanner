import type { Vec2 } from "@/scanner/utils/math/geometry";
import type { ContourExtractionResult, EdgeMap } from "../types";

// Pre-computed neighbor offsets for 4-connectivity
const NEIGHBOR_DX = [-1, 1, 0, 0] as const;
const NEIGHBOR_DY = [0, 0, -1, 1] as const;

/**
 * Optimized connected component extraction using iterative flood fill.
 * Uses typed arrays and pre-allocated stack for better memory efficiency.
 */
export function extractLargestEdgeComponent(edge: EdgeMap): ContourExtractionResult {
  const { width, height, data } = edge;
  const size = width * height;
  const visited = new Uint8Array(size);

  // Pre-allocate stack to avoid repeated array resizing
  // Max possible size is total pixels, but typically much smaller
  const maxStackSize = Math.min(size, 50000);
  const stack = new Int32Array(maxStackSize);

  let componentCount = 0;
  let bestPoints: Vec2[] = [];
  let bestSize = 0;

  const h1 = height - 1;
  const w1 = width - 1;

  for (let y = 1; y < h1; y++) {
    const rowOffset = y * width;
    for (let x = 1; x < w1; x++) {
      const i = rowOffset + x;
      if (!data[i] || visited[i]) continue;

      componentCount++;

      // Flood fill this component
      let stackPtr = 0;
      stack[stackPtr++] = i;
      visited[i] = 1;

      // Count first, collect points only if this is the largest
      let componentSize = 0;
      const componentStart = stackPtr;

      // First pass: count size using BFS
      let readPtr = 0;
      while (readPtr < stackPtr) {
        const cur = stack[readPtr++]!;
        componentSize++;

        const cx = cur % width;
        const cy = (cur - cx) / width;

        // Check all 4 neighbors
        for (let n = 0; n < 4; n++) {
          const nx = cx + NEIGHBOR_DX[n]!;
          const ny = cy + NEIGHBOR_DY[n]!;

          if (nx <= 0 || ny <= 0 || nx >= w1 || ny >= h1) continue;

          const ni = ny * width + nx;
          if (visited[ni] || !data[ni]) continue;

          visited[ni] = 1;
          if (stackPtr < maxStackSize) {
            stack[stackPtr++] = ni;
          }
        }
      }

      // Only extract points if this is the new largest component
      if (componentSize > bestSize) {
        bestSize = componentSize;
        bestPoints = new Array(componentSize);

        // Re-traverse to extract points (using visited marks)
        let ptIdx = 0;
        for (let j = 0; j < stackPtr; j++) {
          const idx = stack[j]!;
          const px = idx % width;
          const py = (idx - px) / width;
          bestPoints[ptIdx++] = { x: px, y: py };
        }
      }
    }
  }

  return { points: bestPoints, componentCount };
}

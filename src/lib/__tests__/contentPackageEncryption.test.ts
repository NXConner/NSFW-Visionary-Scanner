import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock key fetch (server keyring)
vi.mock("@/lib/dlcKeys", () => ({
  fetchDlcKey: vi.fn(),
}));

// Import real contentEncryption singleton
import { contentEncryption } from "@/dlc/security";

describe("contentPackage encrypted file install", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("decrypts application/dlc-encrypted assets before checksum + storage", async () => {
    const { fetchDlcKey } = await import("@/lib/dlcKeys");

    // Create a real AES key and encrypt known bytes.
    const { key: cryptoKey, exportedKey } = await contentEncryption.generateKey();
    const plaintext = new TextEncoder().encode("hello-dlc").buffer;
    const encrypted = await contentEncryption.encrypt(plaintext, cryptoKey);
    const encryptedJson = JSON.stringify(encrypted);

    // Provide key via mocked server call
    (fetchDlcKey as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      keyId: "key-1",
      keyB64: exportedKey,
    });

    // Mock fetch to return the encrypted blob
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(encryptedJson, {
        status: 200,
        headers: { "content-type": "application/dlc-encrypted" },
      }),
    );

    const { installContentPackage, getContentFile } = await import("../contentPackage");

    // sha256 of plaintext bytes
    const hashBuffer = await crypto.subtle.digest("SHA-256", plaintext);
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    const pkgId = "dlc-positions";
    const result = await installContentPackage(
      pkgId,
      {
        version: "1.0.0",
        files: [],
        checksum: "x",
        size: 1,
        releaseDate: new Date().toISOString(),
        changelog: [],
      },
      [
        {
          path: "data/hello.txt",
          url: "https://example.com/encrypted",
          encrypted: true,
          mimeType: "text/plain",
          checksum: hashHex,
          size: encryptedJson.length,
          type: "data",
        },
      ],
    );

    expect(result.success).toBe(true);

    const stored = await getContentFile({ packageId: pkgId, path: "data/hello.txt" });
    expect(stored).not.toBeNull();
    expect(new TextDecoder().decode(stored!)).toBe("hello-dlc");

    expect(fetchSpy).toHaveBeenCalled();
  });
});

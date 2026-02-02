/**
 * Integrity Checker Module
 * Verifies DLC content integrity using checksums
 */

class IntegrityChecker {
  /**
   * Calculate SHA-256 hash of data
   */
  async calculateHash(data: ArrayBuffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  }

  /**
   * Verify content integrity
   */
  async verifyIntegrity(data: ArrayBuffer, expectedHash: string): Promise<boolean> {
    const actualHash = await this.calculateHash(data);
    return actualHash === expectedHash;
  }

  /**
   * Verify blob integrity
   */
  async verifyBlob(blob: Blob, expectedHash: string): Promise<boolean> {
    const data = await blob.arrayBuffer();
    return this.verifyIntegrity(data, expectedHash);
  }

  /**
   * Generate checksum for content
   */
  async generateChecksum(blob: Blob): Promise<string> {
    const data = await blob.arrayBuffer();
    return this.calculateHash(data);
  }

  /**
   * Verify multiple files
   */
  async verifyMultiple(
    files: Array<{ blob: Blob; expectedHash: string }>,
  ): Promise<{ valid: boolean; failures: number[] }> {
    const results = await Promise.all(
      files.map(async (file, index) => ({
        index,
        valid: await this.verifyBlob(file.blob, file.expectedHash),
      })),
    );

    const failures = results.filter(r => !r.valid).map(r => r.index);
    return {
      valid: failures.length === 0,
      failures,
    };
  }
}

export const integrityChecker = new IntegrityChecker();
export { IntegrityChecker };

/**
 * Test-only IndexedDB polyfill.
 *
 * JSDOM does not provide a real IndexedDB implementation. We polyfill it for
 * unit tests that exercise persistence logic (e.g. wallpaper storage).
 */
import "fake-indexeddb/auto";

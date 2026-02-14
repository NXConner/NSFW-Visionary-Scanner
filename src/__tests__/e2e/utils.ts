/**
 * E2E Test Utilities
 * Common utilities for end-to-end testing
 */

// Test IDs for common elements
export const TEST_IDS = {
  // Auth
  loginButton: "login-button",
  signupButton: "signup-button",
  emailInput: "email-input",
  passwordInput: "password-input",
  submitAuth: "submit-auth",
  logoutButton: "logout-button",

  // Navigation
  homeTab: "home-tab",
  scannerTab: "scanner-tab",
  diaryTab: "diary-tab",
  settingsTab: "settings-tab",
  profileTab: "profile-tab",

  // Scanner
  startScanButton: "start-scan-button",
  captureScanButton: "capture-scan-button",
  scanPreview: "scan-preview",
  scanResults: "scan-results",

  // Health Diary
  addEntryButton: "add-entry-button",
  diaryEntryCard: "diary-entry-card",
  saveDiaryEntry: "save-diary-entry",

  // Settings
  themeToggle: "theme-toggle",
  notificationToggle: "notification-toggle",
  privacyDashboard: "privacy-dashboard",
  exportDataButton: "export-data-button",

  // Common
  loadingSpinner: "loading-spinner",
  errorMessage: "error-message",
  successMessage: "success-message",
  modalOverlay: "modal-overlay",
  closeModal: "close-modal",
} as const;

// Wait utilities
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock data generators
export const generateMockUser = () => ({
  email: `test-${Date.now()}@unit.test`,
  password: "TestPassword123!",
});

export const generateMockMeasurement = () => ({
  length: Math.random() * 5 + 10, // 10-15
  circumference: Math.random() * 3 + 10, // 10-13
  curvatureAngle: Math.random() * 30, // 0-30
  notes: "Test measurement entry",
});

// Assertion helpers
export const assertElementExists = (element: Element | null, message?: string) => {
  if (!element) {
    throw new Error(message || "Element not found");
  }
  return element;
};

export const assertTextContent = (element: Element, expectedText: string) => {
  if (!element.textContent?.includes(expectedText)) {
    throw new Error(`Expected text "${expectedText}" not found in element`);
  }
};

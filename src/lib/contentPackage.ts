/**
 * Content Package Management
 * Handles downloading, verifying, and installing DLC content packages
 */

// Modular implementation lives under ./contentPackage/*
// Explicit path avoids directory/file resolution self-reference in bundlers.
export * from "./contentPackage/index";

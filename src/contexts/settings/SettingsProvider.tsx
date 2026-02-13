import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { applyThemeToDocument, themePresets, type ThemePresetId } from "@/design-system";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { uploadFile } from "@/lib/mediaUpload/upload";
import { STORAGE_BUCKETS } from "@/lib/mediaUpload/storage";
import {
  clearCustomWallpaperBlob,
  dataUrlToBlob,
  getCustomWallpaperBlob,
  setCustomWallpaperBlob,
} from "@/lib/wallpaperStorage";
import {
  CUSTOM_WALLPAPER_BLOB_SENTINEL,
  DEFAULT_SETTINGS,
  DEFAULT_CUSTOM_INTERFACE_COLORS,
  SETTINGS_KEY,
  defaultPresetForMode,
} from "./constants";
import {
  isLocalStorageAvailable,
  normalizeStoredSettings,
  safelyParseSettings,
} from "./localStorage";
import { parseCloudSettingsPayload, type CloudWallpaperV1 } from "./cloud";
import type {
  APIAccessSettings,
  AchievementSettings,
  AROverlaySettings,
  ColorBlindMode,
  CustomInterfaceColors,
  DashboardSettings,
  FontFamily,
  FontSize,
  HealthTrackingSettings,
  MeasurementUnitDisplay,
  NotificationPreferences,
  OfflineModeSettings,
  PressureUnitDisplay,
  ProfileSettings,
  SettingsContextType,
  StoredSettings,
  ThemeMode,
  ThemeExtendedSettings,
  VoiceGuidanceSettings,
} from "./types";

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

function getWallpaperExtHintFromFile(file: File): string | undefined {
  const name = file.name || "";
  const ext = name.split(".").pop();
  return ext ? ext.toLowerCase() : undefined;
}

function inferExtFromBlobType(blob: Blob): string {
  const t = blob.type || "";
  if (t.includes("webm")) return "webm";
  if (t.includes("mp4")) return "mp4";
  if (t.includes("quicktime")) return "mov";
  if (t.includes("png")) return "png";
  if (t.includes("gif")) return "gif";
  if (t.includes("webp")) return "webp";
  if (t.includes("jpeg") || t.includes("jpg")) return "jpg";
  return "bin";
}

function mergeDefined<T extends object>(base: T, patch: Partial<T>): T {
  const next: any = { ...(base as any) };
  for (const [k, v] of Object.entries(patch as Record<string, unknown>)) {
    if (v !== undefined) next[k] = v;
  }
  return next as T;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const initial = useMemo(() => {
    try {
      return typeof window !== "undefined" ? safelyParseSettings() : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }, []);

  const [themePreset, setThemePresetState] = useState<ThemePresetId>(initial.themePreset);
  const [customWallpaper, setCustomWallpaperState] = useState<string | null>(
    initial.customWallpaper,
  );
  const [customWallpaperStoredAsBlob, setCustomWallpaperStoredAsBlob] = useState<boolean>(false);
  const [cloudWallpaper, setCloudWallpaper] = useState<CloudWallpaperV1>({ kind: "none" });
  const [wallpaperBlur, setWallpaperBlurState] = useState<number>(initial.wallpaperBlur);
  const [wallpaperOpacity, setWallpaperOpacityState] = useState<number>(initial.wallpaperOpacity);
  const [fontSize, setFontSizeState] = useState<FontSize>(initial.fontSize);
  const [fontFamily, setFontFamilyState] = useState<FontFamily>(initial.fontFamily);
  const [customAccentColor, setCustomAccentColorState] = useState<string | null>(
    initial.customAccentColor,
  );
  const [customInterfaceColors, setCustomInterfaceColorsState] = useState<CustomInterfaceColors>(
    initial.customInterfaceColors ?? DEFAULT_CUSTOM_INTERFACE_COLORS,
  );
  const [colorBlindMode, setColorBlindModeState] = useState<ColorBlindMode>(initial.colorBlindMode);
  const [measurementUnits, setMeasurementUnitsState] = useState<MeasurementUnitDisplay>(
    initial.measurementUnits,
  );
  const [pressureUnits, setPressureUnitsState] = useState<PressureUnitDisplay>(
    initial.pressureUnits,
  );
  const [hapticEnabled, setHapticEnabledState] = useState<boolean>(initial.hapticEnabled);
  const [notificationsEnabled, setNotificationsEnabledState] = useState<boolean>(
    initial.notificationsEnabled,
  );
  const [reminderTime, setReminderTimeState] = useState<string>(initial.reminderTime);
  const [reminderDays, setReminderDaysState] = useState<number[]>(initial.reminderDays);
  const [uiFxEnabled, setUiFxEnabledState] = useState<boolean>(initial.uiFxEnabled);
  const [uiFxCardsEnabled, setUiFxCardsEnabledState] = useState<boolean>(initial.uiFxCardsEnabled);
  const [uiFxCardTiltEnabled, setUiFxCardTiltEnabledState] = useState<boolean>(
    initial.uiFxCardTiltEnabled,
  );
  const [uiFxButtonsEnabled, setUiFxButtonsEnabledState] = useState<boolean>(
    initial.uiFxButtonsEnabled,
  );
  const [uiFxGlowEnabled, setUiFxGlowEnabledState] = useState<boolean>(initial.uiFxGlowEnabled);
  const [uiFxRippleEnabled, setUiFxRippleEnabledState] = useState<boolean>(
    initial.uiFxRippleEnabled,
  );
  const [uiFxWallpaperMotionEnabled, setUiFxWallpaperMotionEnabledState] = useState<boolean>(
    initial.uiFxWallpaperMotionEnabled,
  );
  const [arOverlay, setAROverlayState] = useState<AROverlaySettings>(initial.arOverlay);
  const [offlineMode, setOfflineModeState] = useState<OfflineModeSettings>(initial.offlineMode);
  const [notificationPreferences, setNotificationPreferencesState] =
    useState<NotificationPreferences>(initial.notificationPreferences);
  const [profileSettings, setProfileSettingsState] = useState<ProfileSettings>(
    initial.profileSettings,
  );
  const [voiceGuidance, setVoiceGuidanceState] = useState<VoiceGuidanceSettings>(
    initial.voiceGuidance,
  );
  const [achievements, setAchievementsState] = useState<AchievementSettings>(initial.achievements);
  const [healthTracking, setHealthTrackingState] = useState<HealthTrackingSettings>(
    initial.healthTracking,
  );
  const [dashboard, setDashboardState] = useState<DashboardSettings>(initial.dashboard);
  const [themeExtended, setThemeExtendedState] = useState<ThemeExtendedSettings>(
    initial.themeExtended,
  );
  const [apiAccess, setApiAccessState] = useState<APIAccessSettings>(initial.apiAccess);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const suppressCloudSyncRef = useRef(false);
  const cloudHydratedForUserIdRef = useRef<string | null>(null);
  const lastCloudSettingsHashRef = useRef<string | null>(null);
  const activeCloudLoadUserIdRef = useRef<string | null>(null);
  const wallpaperUploadInFlightRef = useRef(false);

  const activeWallpaperObjectUrlRef = useRef<string | null>(null);
  const theme: ThemeMode = themePresets[themePreset]?.mode ?? DEFAULT_SETTINGS.theme;

  const revokeActiveObjectUrl = useCallback(() => {
    const current = activeWallpaperObjectUrlRef.current;
    if (current && current.startsWith("blob:")) {
      const url = current.split("#", 1)[0];
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
    }
    activeWallpaperObjectUrlRef.current = null;
  }, []);

  const createWallpaperObjectUrl = useCallback((blob: Blob, extHint?: string) => {
    const url = URL.createObjectURL(blob);
    const ext = extHint || inferExtFromBlobType(blob);
    const decorated = `${url}#wallpaper.${ext}`;
    activeWallpaperObjectUrlRef.current = decorated;
    return decorated;
  }, []);

  useEffect(() => {
    return () => {
      revokeActiveObjectUrl();
    };
  }, [revokeActiveObjectUrl]);

  const persistSettings = useCallback(
    (overrides: Partial<StoredSettings> = {}) => {
      try {
        if (!isLocalStorageAvailable()) return;
        const hasOverrideWallpaper = Object.prototype.hasOwnProperty.call(
          overrides,
          "customWallpaper",
        );
        const overrideWallpaper = hasOverrideWallpaper
          ? (overrides as any).customWallpaper
          : undefined;
        const storeAsBlob = hasOverrideWallpaper
          ? overrideWallpaper === CUSTOM_WALLPAPER_BLOB_SENTINEL
          : customWallpaperStoredAsBlob;
        const nextWallpaperValue = hasOverrideWallpaper ? overrideWallpaper : customWallpaper;
        const persistedCustomWallpaper = storeAsBlob
          ? CUSTOM_WALLPAPER_BLOB_SENTINEL
          : typeof nextWallpaperValue === "string"
            ? nextWallpaperValue
            : null;
        const payload: StoredSettings = {
          theme,
          themePreset,
          wallpaperBlur,
          wallpaperOpacity,
          fontSize,
          fontFamily,
          customAccentColor,
          customInterfaceColors,
          colorBlindMode,
          measurementUnits,
          pressureUnits,
          hapticEnabled,
          notificationsEnabled,
          reminderTime,
          reminderDays,
          uiFxEnabled,
          uiFxCardsEnabled,
          uiFxCardTiltEnabled,
          uiFxButtonsEnabled,
          uiFxGlowEnabled,
          uiFxRippleEnabled,
          uiFxWallpaperMotionEnabled,
          arOverlay,
          offlineMode,
          notificationPreferences,
          profileSettings,
          voiceGuidance,
          achievements,
          healthTracking,
          dashboard,
          themeExtended,
          apiAccess,
          ...overrides,
          // Ensure customWallpaper is always persisted as either a stable string or the blob sentinel.
          customWallpaper: persistedCustomWallpaper,
        };
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(payload));
      } catch (error) {
        // Error silently handled
      }
    },
    [
      theme,
      themePreset,
      customWallpaper,
      customWallpaperStoredAsBlob,
      wallpaperBlur,
      wallpaperOpacity,
      fontSize,
      fontFamily,
      customAccentColor,
      customInterfaceColors,
      colorBlindMode,
      measurementUnits,
      pressureUnits,
      hapticEnabled,
      notificationsEnabled,
      reminderTime,
      reminderDays,
      uiFxEnabled,
      uiFxCardsEnabled,
      uiFxCardTiltEnabled,
      uiFxButtonsEnabled,
      uiFxGlowEnabled,
      uiFxRippleEnabled,
      uiFxWallpaperMotionEnabled,
      arOverlay,
      offlineMode,
      notificationPreferences,
      profileSettings,
      voiceGuidance,
      achievements,
      healthTracking,
      dashboard,
      themeExtended,
      apiAccess,
    ],
  );

  // Load custom wallpaper from IndexedDB if present (and migrate legacy data URLs)
  useEffect(() => {
    if (!isLocalStorageAvailable()) return;

    let cancelled = false;
    const run = async () => {
      try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as Partial<StoredSettings>;
        const storedCustom = parsed.customWallpaper;

        // Legacy migration: data URL stored inline
        if (typeof storedCustom === "string" && storedCustom.startsWith("data:")) {
          const blob = dataUrlToBlob(storedCustom);
          await setCustomWallpaperBlob(blob);
          if (cancelled) return;
          revokeActiveObjectUrl();
          const next = createWallpaperObjectUrl(blob);
          setCustomWallpaperStoredAsBlob(true);
          setCustomWallpaperState(next);
          persistSettings({ customWallpaper: CUSTOM_WALLPAPER_BLOB_SENTINEL });
          return;
        }

        if (storedCustom !== CUSTOM_WALLPAPER_BLOB_SENTINEL) return;

        const blob = await getCustomWallpaperBlob();
        if (!blob || cancelled) return;
        revokeActiveObjectUrl();
        const next = createWallpaperObjectUrl(blob);
        setCustomWallpaperStoredAsBlob(true);
        setCustomWallpaperState(next);
      } catch {
        // ignore
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [createWallpaperObjectUrl, persistSettings, revokeActiveObjectUrl]);

  const buildCloudSettingsPayload = useCallback(() => {
    const settings: StoredSettings = {
      theme,
      themePreset,
      // Object URLs are device-local and must never be synced.
      customWallpaper: customWallpaperStoredAsBlob ? null : customWallpaper,
      wallpaperBlur,
      wallpaperOpacity,
      fontSize,
      fontFamily,
      customAccentColor,
      customInterfaceColors,
      colorBlindMode,
      measurementUnits,
      pressureUnits,
      hapticEnabled,
      notificationsEnabled,
      reminderTime,
      reminderDays,
      uiFxEnabled,
      uiFxCardsEnabled,
      uiFxCardTiltEnabled,
      uiFxButtonsEnabled,
      uiFxGlowEnabled,
      uiFxRippleEnabled,
      uiFxWallpaperMotionEnabled,
      arOverlay,
      offlineMode,
      notificationPreferences,
      profileSettings,
      voiceGuidance,
      achievements,
      healthTracking,
      dashboard,
      themeExtended,
      apiAccess,
    };

    const wallpaper: CloudWallpaperV1 = customWallpaperStoredAsBlob
      ? cloudWallpaper.kind === "upload"
        ? cloudWallpaper
        : { kind: "none" }
      : customWallpaper
        ? { kind: "preset", value: customWallpaper }
        : { kind: "none" };

    return { v: 1 as const, settings, wallpaper };
  }, [
    achievements,
    apiAccess,
    arOverlay,
    cloudWallpaper,
    colorBlindMode,
    customAccentColor,
    customInterfaceColors,
    customWallpaper,
    customWallpaperStoredAsBlob,
    dashboard,
    fontFamily,
    fontSize,
    hapticEnabled,
    healthTracking,
    measurementUnits,
    notificationsEnabled,
    notificationPreferences,
    offlineMode,
    pressureUnits,
    profileSettings,
    reminderDays,
    reminderTime,
    theme,
    themeExtended,
    themePreset,
    uiFxButtonsEnabled,
    uiFxCardTiltEnabled,
    uiFxCardsEnabled,
    uiFxEnabled,
    uiFxGlowEnabled,
    uiFxRippleEnabled,
    uiFxWallpaperMotionEnabled,
    voiceGuidance,
    wallpaperBlur,
    wallpaperOpacity,
  ]);

  const pushCloudSettings = useCallback(
    async (opts: { silent?: boolean; force?: boolean } = {}): Promise<void> => {
      const silent = Boolean(opts.silent);
      const force = Boolean(opts.force);
      if (!user?.id) return;
      if (suppressCloudSyncRef.current) return;

      const payload = buildCloudSettingsPayload();
      let hash = "";
      try {
        hash = JSON.stringify(payload);
      } catch {
        // If stringify fails (shouldn't), force a push and avoid caching.
        hash = `__unhashable__:${Date.now()}`;
      }

      if (!force && lastCloudSettingsHashRef.current === hash) return;

      setIsSyncing(true);
      try {
        const { error } = await supabase.from("user_preferences").upsert(
          {
            user_id: user.id,
            theme,
            theme_preset: themePreset,
            font_size: fontSize,
            color_blind_mode: colorBlindMode,
            haptic_enabled: hapticEnabled,
            notifications_enabled: notificationsEnabled,
            reminder_time: reminderTime,
            reminder_days: reminderDays,
            settings: payload,
          },
          { onConflict: "user_id" },
        );

        if (error) throw error;
        lastCloudSettingsHashRef.current = hash;
        cloudHydratedForUserIdRef.current = user.id;
        if (!silent) toast.success("Settings synced to cloud");
      } catch (error) {
        if (!silent) toast.error("Failed to sync settings");
      } finally {
        setIsSyncing(false);
      }
    },
    [
      buildCloudSettingsPayload,
      colorBlindMode,
      fontSize,
      hapticEnabled,
      notificationsEnabled,
      reminderDays,
      reminderTime,
      theme,
      themePreset,
      user?.id,
    ],
  );

  const syncToCloud = useCallback(async (): Promise<void> => {
    await pushCloudSettings({ silent: false, force: true });
  }, [pushCloudSettings]);

  // Track if we've already loaded settings for this user to prevent loops
  const hasLoadedCloudSettingsRef = useRef<string | null>(null);

  const applySettingsSnapshot = useCallback((s: StoredSettings): void => {
    setThemePresetState(s.themePreset);
    setWallpaperBlurState(s.wallpaperBlur);
    setWallpaperOpacityState(s.wallpaperOpacity);
    setFontSizeState(s.fontSize);
    setFontFamilyState(s.fontFamily);
    setCustomAccentColorState(s.customAccentColor);
    setCustomInterfaceColorsState(s.customInterfaceColors ?? DEFAULT_CUSTOM_INTERFACE_COLORS);
    setColorBlindModeState(s.colorBlindMode);
    setMeasurementUnitsState(s.measurementUnits);
    setPressureUnitsState(s.pressureUnits);
    setHapticEnabledState(s.hapticEnabled);
    setNotificationsEnabledState(s.notificationsEnabled);
    setReminderTimeState(s.reminderTime);
    setReminderDaysState(s.reminderDays);
    setUiFxEnabledState(s.uiFxEnabled);
    setUiFxCardsEnabledState(s.uiFxCardsEnabled);
    setUiFxCardTiltEnabledState(s.uiFxCardTiltEnabled);
    setUiFxButtonsEnabledState(s.uiFxButtonsEnabled);
    setUiFxGlowEnabledState(s.uiFxGlowEnabled);
    setUiFxRippleEnabledState(s.uiFxRippleEnabled);
    setUiFxWallpaperMotionEnabledState(s.uiFxWallpaperMotionEnabled);
    setAROverlayState(s.arOverlay);
    setOfflineModeState(s.offlineMode);
    setNotificationPreferencesState(s.notificationPreferences);
    setProfileSettingsState(s.profileSettings);
    setVoiceGuidanceState(s.voiceGuidance);
    setAchievementsState(s.achievements);
    setHealthTrackingState(s.healthTracking);
    setDashboardState(s.dashboard);
    setThemeExtendedState(s.themeExtended);
    setApiAccessState(s.apiAccess);
  }, []);

  const loadCloudSettings = useCallback(
    async (userId: string) => {
      // Prevent multiple loads for the same user
      if (hasLoadedCloudSettingsRef.current === userId) return;
      hasLoadedCloudSettingsRef.current = userId;
      activeCloudLoadUserIdRef.current = userId;
      suppressCloudSyncRef.current = true;

      try {
        const { data, error } = await supabase
          .from("user_preferences")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (error) throw error;

        // If another user started loading after we did, ignore late results.
        if (activeCloudLoadUserIdRef.current !== userId) return;

        if (!data) {
          // No cloud settings exist yet: seed from local state (silent).
          await pushCloudSettings({ silent: true, force: true });
          cloudHydratedForUserIdRef.current = userId;
          return;
        }

        // Prefer the settings JSON blob if present.
        const parsed = data.settings ? parseCloudSettingsPayload(data.settings) : null;
        if (parsed) {
          const normalized = normalizeStoredSettings(parsed.settings as Partial<StoredSettings>);
          applySettingsSnapshot(normalized);

          // Persist the normalized snapshot locally. For cloud-uploaded wallpapers we persist the
          // blob sentinel so we don't wipe any existing local wallpaper state if the download fails.
          persistSettings(
            parsed.wallpaper.kind === "upload"
              ? { ...normalized, customWallpaper: CUSTOM_WALLPAPER_BLOB_SENTINEL }
              : normalized,
          );

          setCloudWallpaper(parsed.wallpaper);

          // Apply wallpaper (preset/upload/none)
          if (parsed.wallpaper.kind === "preset") {
            revokeActiveObjectUrl();
            setCustomWallpaperStoredAsBlob(false);
            setCustomWallpaperState(parsed.wallpaper.value || null);
            persistSettings({ ...normalized, customWallpaper: parsed.wallpaper.value || null });
            void clearCustomWallpaperBlob();
            applyThemeToDocument(
              normalized.themePreset,
              parsed.wallpaper.value || null,
              normalized.wallpaperBlur,
              normalized.wallpaperOpacity,
            );
          } else if (parsed.wallpaper.kind === "upload") {
            try {
              const { data: blob, error: dlErr } = await supabase.storage
                .from(parsed.wallpaper.bucket)
                .download(parsed.wallpaper.path);
              if (dlErr || !blob) throw dlErr ?? new Error("Wallpaper download failed");
              if (activeCloudLoadUserIdRef.current !== userId) return;

              await setCustomWallpaperBlob(blob);
              if (activeCloudLoadUserIdRef.current !== userId) return;

              revokeActiveObjectUrl();
              const next = createWallpaperObjectUrl(blob, parsed.wallpaper.ext ?? undefined);
              setCustomWallpaperStoredAsBlob(true);
              setCustomWallpaperState(next);
              persistSettings({ ...normalized, customWallpaper: CUSTOM_WALLPAPER_BLOB_SENTINEL });
              applyThemeToDocument(
                normalized.themePreset,
                next,
                normalized.wallpaperBlur,
                normalized.wallpaperOpacity,
              );
            } catch (err) {
              logger.warn("[settings] Failed to restore wallpaper from cloud", {
                error: err instanceof Error ? err.message : String(err),
              });
            }
          } else {
            // none
            revokeActiveObjectUrl();
            setCustomWallpaperStoredAsBlob(false);
            setCustomWallpaperState(null);
            persistSettings({ ...normalized, customWallpaper: null });
            void clearCustomWallpaperBlob();
            applyThemeToDocument(
              normalized.themePreset,
              null,
              normalized.wallpaperBlur,
              normalized.wallpaperOpacity,
            );
          }

          // Cache remote payload hash to prevent immediate no-op pushes.
          try {
            lastCloudSettingsHashRef.current = JSON.stringify({
              v: 1,
              settings: {
                ...normalized,
                customWallpaper:
                  parsed.wallpaper.kind === "upload" ? null : normalized.customWallpaper,
              },
              wallpaper: parsed.wallpaper,
            });
          } catch {
            lastCloudSettingsHashRef.current = null;
          }

          cloudHydratedForUserIdRef.current = userId;
          toast.success("Settings loaded from cloud");
          return;
        }

        // Back-compat: apply legacy scalar columns if settings blob is missing.
        const legacy: Partial<StoredSettings> = {};
        if (data.theme_preset) legacy.themePreset = data.theme_preset as ThemePresetId;
        if (data.font_size) legacy.fontSize = data.font_size as FontSize;
        if (data.color_blind_mode) legacy.colorBlindMode = data.color_blind_mode as ColorBlindMode;
        if (typeof data.haptic_enabled === "boolean") legacy.hapticEnabled = data.haptic_enabled;
        if (typeof data.notifications_enabled === "boolean")
          legacy.notificationsEnabled = data.notifications_enabled;
        if (data.reminder_time) legacy.reminderTime = data.reminder_time;
        if (data.reminder_days) legacy.reminderDays = data.reminder_days;

        const current = safelyParseSettings();
        const merged = normalizeStoredSettings({ ...current, ...legacy });
        applySettingsSnapshot(merged);
        persistSettings(merged);
        setCloudWallpaper({ kind: "none" });
        cloudHydratedForUserIdRef.current = userId;
        toast.success("Settings loaded from cloud");
      } catch (error) {
        // Reset the ref so we can retry on next mount
        hasLoadedCloudSettingsRef.current = null;
        cloudHydratedForUserIdRef.current = null;
      } finally {
        if (activeCloudLoadUserIdRef.current === userId) {
          suppressCloudSyncRef.current = false;
        }
      }
    },
    [
      applySettingsSnapshot,
      createWallpaperObjectUrl,
      persistSettings,
      pushCloudSettings,
      revokeActiveObjectUrl,
    ],
  );

  // Load settings from cloud when user logs in (only once per user)
  useEffect(() => {
    if (user?.id) {
      void loadCloudSettings(user.id);
    } else {
      // Reset when user logs out so we can load again on next login
      hasLoadedCloudSettingsRef.current = null;
      activeCloudLoadUserIdRef.current = null;
      suppressCloudSyncRef.current = false;
      cloudHydratedForUserIdRef.current = null;
      lastCloudSettingsHashRef.current = null;
      setCloudWallpaper({ kind: "none" });
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Background cloud sync (debounced) — persists ALL settings across devices.
  useEffect(() => {
    if (!user?.id) return;
    if (cloudHydratedForUserIdRef.current !== user.id) return;
    if (suppressCloudSyncRef.current) return;
    if (wallpaperUploadInFlightRef.current) return;

    const t = window.setTimeout(() => {
      void pushCloudSettings({ silent: true });
    }, 750);

    return () => window.clearTimeout(t);
  }, [pushCloudSettings, user?.id]);

  // If a user already has a local custom wallpaper blob (IndexedDB) but the cloud has no upload ref,
  // automatically upload it once so it persists across devices.
  useEffect(() => {
    if (!user?.id) return;
    if (cloudHydratedForUserIdRef.current !== user.id) return;
    if (suppressCloudSyncRef.current) return;
    if (wallpaperUploadInFlightRef.current) return;
    if (cloudWallpaper.kind !== "none") return;
    if (!customWallpaperStoredAsBlob) return;

    wallpaperUploadInFlightRef.current = true;

    void (async () => {
      try {
        const blob = await getCustomWallpaperBlob();
        if (!blob) return;

        const ext = inferExtFromBlobType(blob);
        const mimeType = blob.type || "application/octet-stream";
        const file = new File([blob], `wallpaper.${ext}`, { type: mimeType });

        const uploaded = await uploadFile(file, {
          bucket: STORAGE_BUCKETS.WALLPAPERS,
          folder: "wallpapers",
          allowedTypes: [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp",
            "video/mp4",
            "video/webm",
            "video/quicktime",
          ],
          maxSize: mimeType.startsWith("video/") ? 50 * 1024 * 1024 : 10 * 1024 * 1024,
          userScoped: true,
          compress: !mimeType.startsWith("video/"),
        });
        if (!uploaded?.path) throw new Error("Upload failed");

        const ref: CloudWallpaperV1 = {
          kind: "upload",
          bucket: String(uploaded.bucket || STORAGE_BUCKETS.WALLPAPERS),
          path: String(uploaded.path || ""),
          mimeType: String(uploaded.mimeType || mimeType),
          sizeBytes: Number(uploaded.sizeBytes ?? blob.size) || blob.size,
          updatedAtMs: Date.now(),
          ext,
          isVideo: mimeType.startsWith("video/"),
        };

        setCloudWallpaper(ref);

        const latest = safelyParseSettings();
        const payload = {
          v: 1 as const,
          settings: { ...latest, customWallpaper: null } as StoredSettings,
          wallpaper: ref,
        };

        const hash = JSON.stringify(payload);
        const { error } = await supabase.from("user_preferences").upsert(
          {
            user_id: user.id,
            theme: latest.theme,
            theme_preset: latest.themePreset,
            font_size: latest.fontSize,
            color_blind_mode: latest.colorBlindMode,
            haptic_enabled: latest.hapticEnabled,
            notifications_enabled: latest.notificationsEnabled,
            reminder_time: latest.reminderTime,
            reminder_days: latest.reminderDays,
            settings: payload,
          },
          { onConflict: "user_id" },
        );
        if (error) throw error;

        lastCloudSettingsHashRef.current = hash;
      } catch (err) {
        logger.warn("[settings] Auto-upload of existing wallpaper failed", {
          error: err instanceof Error ? err.message : String(err),
        });
      } finally {
        wallpaperUploadInFlightRef.current = false;
      }
    })();
  }, [cloudWallpaper.kind, customWallpaperStoredAsBlob, user?.id]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    applyThemeToDocument(themePreset, customWallpaper, wallpaperBlur, wallpaperOpacity);
  }, [themePreset, customWallpaper, wallpaperBlur, wallpaperOpacity]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const sizes: Record<FontSize, string> = {
      small: "14px",
      medium: "16px",
      large: "18px",
      xlarge: "20px",
    };
    document.documentElement.style.fontSize = sizes[fontSize];
  }, [fontSize]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const fonts: Record<FontFamily, string> = {
      system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      inter: '"Inter", sans-serif',
      playfair: '"Playfair Display", serif',
      "space-grotesk": '"Space Grotesk", sans-serif',
      jetbrains: '"JetBrains Mono", monospace',
      poppins: '"Poppins", sans-serif',
      outfit: '"Outfit", sans-serif',
      sora: '"Sora", sans-serif',
    };
    document.documentElement.style.setProperty("--font-family", fonts[fontFamily]);
    document.body.style.fontFamily = fonts[fontFamily];
  }, [fontFamily]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (customAccentColor) {
      document.documentElement.style.setProperty("--primary", customAccentColor);
      document.documentElement.style.setProperty("--ring", customAccentColor);
    }
  }, [customAccentColor]);

  // Apply custom interface colors to document
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;

    const colorMap: Record<keyof CustomInterfaceColors, string> = {
      primary: "--primary",
      secondary: "--secondary",
      accent: "--accent",
      background: "--background",
      foreground: "--foreground",
      muted: "--muted",
      mutedForeground: "--muted-foreground",
      border: "--border",
      card: "--card",
      cardForeground: "--card-foreground",
      destructive: "--destructive",
    };

    Object.entries(customInterfaceColors).forEach(([key, value]) => {
      const cssVar = colorMap[key as keyof CustomInterfaceColors];
      if (cssVar && value) {
        root.style.setProperty(cssVar, value);
      }
    });
  }, [customInterfaceColors]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-color-blind", colorBlindMode);
  }, [colorBlindMode]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.dataset.uiFx = uiFxEnabled ? "on" : "off";
    root.dataset.uiFxCards = uiFxCardsEnabled ? "on" : "off";
    root.dataset.uiFxCardTilt = uiFxCardTiltEnabled ? "on" : "off";
    root.dataset.uiFxButtons = uiFxButtonsEnabled ? "on" : "off";
    root.dataset.uiFxGlow = uiFxGlowEnabled ? "on" : "off";
    root.dataset.uiFxRipple = uiFxRippleEnabled ? "on" : "off";
    root.dataset.uiFxWallpaper = uiFxWallpaperMotionEnabled ? "on" : "off";
  }, [
    uiFxEnabled,
    uiFxButtonsEnabled,
    uiFxCardTiltEnabled,
    uiFxCardsEnabled,
    uiFxGlowEnabled,
    uiFxRippleEnabled,
    uiFxWallpaperMotionEnabled,
  ]);

  const setTheme = useCallback(
    (mode: ThemeMode) => {
      const nextPreset =
        themePresets[themePreset]?.mode === mode ? themePreset : defaultPresetForMode[mode];
      setThemePresetState(nextPreset);
      persistSettings({ theme: mode, themePreset: nextPreset });
    },
    [persistSettings, themePreset],
  );

  const setThemePreset = useCallback(
    (preset: ThemePresetId) => {
      setThemePresetState(preset);
      const resolvedTheme = themePresets[preset]?.mode ?? theme;
      persistSettings({ themePreset: preset, theme: resolvedTheme });
      // Apply immediately so the UI doesn't "snap back" or appear to cycle.
      applyThemeToDocument(preset, customWallpaper, wallpaperBlur, wallpaperOpacity);
    },
    [customWallpaper, persistSettings, theme, wallpaperBlur, wallpaperOpacity],
  );

  const setCustomWallpaperFromFile = useCallback(
    (file: File) => {
      setCustomWallpaperStoredAsBlob(true);
      revokeActiveObjectUrl();
      const next = createWallpaperObjectUrl(file, getWallpaperExtHintFromFile(file));
      setCustomWallpaperState(next);
      persistSettings({ customWallpaper: CUSTOM_WALLPAPER_BLOB_SENTINEL });
      // Apply immediately with the object URL for instant feedback.
      applyThemeToDocument(themePreset, next, wallpaperBlur, wallpaperOpacity);
      setCustomWallpaperBlob(file).catch(() => {
        toast.error("Failed to save wallpaper");
      });

      // Best-effort cloud upload for cross-device persistence.
      if (!user?.id) return;
      const prevUpload = cloudWallpaper.kind === "upload" ? cloudWallpaper : null;
      wallpaperUploadInFlightRef.current = true;

      void (async () => {
        try {
          const validTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp",
            "video/mp4",
            "video/webm",
            "video/quicktime",
          ];
          if (!validTypes.includes(file.type)) {
            throw new Error("Invalid wallpaper type");
          }

          const maxSize = file.type.startsWith("video/") ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
          if (file.size > maxSize) {
            throw new Error("Wallpaper file too large");
          }

          const uploaded = await uploadFile(file, {
            bucket: STORAGE_BUCKETS.WALLPAPERS,
            folder: "wallpapers",
            allowedTypes: validTypes,
            maxSize,
            userScoped: true,
            compress: !file.type.startsWith("video/"),
          });
          if (!uploaded?.path) throw new Error("Upload failed");

          const ref: CloudWallpaperV1 = {
            kind: "upload",
            bucket: String(uploaded.bucket || STORAGE_BUCKETS.WALLPAPERS),
            path: String(uploaded.path || ""),
            mimeType: String(uploaded.mimeType || file.type || "application/octet-stream"),
            sizeBytes: Number(uploaded.sizeBytes ?? file.size) || file.size,
            updatedAtMs: Date.now(),
            ext: getWallpaperExtHintFromFile(file) ?? null,
            isVideo: file.type.startsWith("video/"),
          };
          if (!ref.path) throw new Error("Upload returned empty path");

          setCloudWallpaper(ref);

          // Best-effort cleanup: delete the previously synced upload (if any).
          if (prevUpload && prevUpload.bucket === ref.bucket && prevUpload.path !== ref.path) {
            try {
              await supabase.storage.from(prevUpload.bucket).remove([prevUpload.path]);
            } catch {
              // ignore
            }
          }

          // Persist cloud settings using the latest local snapshot to avoid stale React closures.
          const latest = safelyParseSettings();
          const payload = {
            v: 1 as const,
            settings: { ...latest, customWallpaper: null } as StoredSettings,
            wallpaper: ref,
          };

          const hash = JSON.stringify(payload);
          const { error } = await supabase.from("user_preferences").upsert(
            {
              user_id: user.id,
              theme: latest.theme,
              theme_preset: latest.themePreset,
              font_size: latest.fontSize,
              color_blind_mode: latest.colorBlindMode,
              haptic_enabled: latest.hapticEnabled,
              notifications_enabled: latest.notificationsEnabled,
              reminder_time: latest.reminderTime,
              reminder_days: latest.reminderDays,
              settings: payload,
            },
            { onConflict: "user_id" },
          );
          if (error) throw error;

          lastCloudSettingsHashRef.current = hash;
          cloudHydratedForUserIdRef.current = user.id;
        } catch (err) {
          logger.warn("[settings] Wallpaper cloud upload failed", {
            error: err instanceof Error ? err.message : String(err),
          });
        } finally {
          wallpaperUploadInFlightRef.current = false;
        }
      })();
    },
    [
      createWallpaperObjectUrl,
      cloudWallpaper,
      persistSettings,
      revokeActiveObjectUrl,
      themePreset,
      user?.id,
      wallpaperBlur,
      wallpaperOpacity,
    ],
  );

  const setCustomWallpaper = useCallback(
    (value: string | null) => {
      if (!value) {
        // If we were using a cloud-uploaded wallpaper, clear the ref and (best-effort) delete the object.
        const prevUpload = cloudWallpaper.kind === "upload" ? cloudWallpaper : null;
        setCloudWallpaper({ kind: "none" });
        revokeActiveObjectUrl();
        setCustomWallpaperStoredAsBlob(false);
        setCustomWallpaperState(null);
        persistSettings({ customWallpaper: null });
        applyThemeToDocument(themePreset, null, wallpaperBlur, wallpaperOpacity);
        void clearCustomWallpaperBlob();

        if (user?.id && prevUpload) {
          void supabase.storage
            .from(prevUpload.bucket)
            .remove([prevUpload.path])
            .catch(() => {
              // ignore
            });
        }
        return;
      }

      // If a data URL is passed (legacy path), migrate into IndexedDB blob storage asynchronously.
      if (value.startsWith("data:")) {
        setCustomWallpaperStoredAsBlob(true);
        setCustomWallpaperState(value);
        persistSettings({ customWallpaper: CUSTOM_WALLPAPER_BLOB_SENTINEL });
        applyThemeToDocument(themePreset, value, wallpaperBlur, wallpaperOpacity);
        void (async () => {
          try {
            const blob = dataUrlToBlob(value);
            await setCustomWallpaperBlob(blob);
            revokeActiveObjectUrl();
            const next = createWallpaperObjectUrl(blob);
            setCustomWallpaperState(next);
            applyThemeToDocument(themePreset, next, wallpaperBlur, wallpaperOpacity);
          } catch {
            // keep data URL in memory if migration fails
          }
        })();
        return;
      }

      // Preset gradient / remote URL string: store inline
      // If we were previously using a cloud-uploaded wallpaper, clean it up.
      const prevUpload = cloudWallpaper.kind === "upload" ? cloudWallpaper : null;
      if (prevUpload && user?.id) {
        setCloudWallpaper({ kind: "none" });
        void supabase.storage
          .from(prevUpload.bucket)
          .remove([prevUpload.path])
          .catch(() => {
            // ignore
          });
      }
      revokeActiveObjectUrl();
      setCustomWallpaperStoredAsBlob(false);
      setCustomWallpaperState(value);
      persistSettings({ customWallpaper: value });
      applyThemeToDocument(themePreset, value, wallpaperBlur, wallpaperOpacity);
      void clearCustomWallpaperBlob();
    },
    [
      cloudWallpaper,
      createWallpaperObjectUrl,
      persistSettings,
      revokeActiveObjectUrl,
      themePreset,
      user?.id,
      wallpaperBlur,
      wallpaperOpacity,
    ],
  );

  const setWallpaperBlur = useCallback(
    (blur: number) => {
      setWallpaperBlurState(blur);
      persistSettings({ wallpaperBlur: blur });
      applyThemeToDocument(themePreset, customWallpaper, blur, wallpaperOpacity);
    },
    [customWallpaper, persistSettings, themePreset, wallpaperOpacity],
  );

  const setWallpaperOpacity = useCallback(
    (opacity: number) => {
      setWallpaperOpacityState(opacity);
      persistSettings({ wallpaperOpacity: opacity });
      applyThemeToDocument(themePreset, customWallpaper, wallpaperBlur, opacity);
    },
    [customWallpaper, persistSettings, themePreset, wallpaperBlur],
  );

  const setFontSize = useCallback(
    (size: FontSize) => {
      setFontSizeState(size);
      persistSettings({ fontSize: size });
    },
    [persistSettings],
  );

  const setFontFamily = useCallback(
    (font: FontFamily) => {
      setFontFamilyState(font);
      persistSettings({ fontFamily: font });
    },
    [persistSettings],
  );

  const setCustomAccentColor = useCallback(
    (color: string | null) => {
      setCustomAccentColorState(color);
      persistSettings({ customAccentColor: color });
    },
    [persistSettings],
  );

  const setCustomInterfaceColors = useCallback(
    (colors: CustomInterfaceColors) => {
      setCustomInterfaceColorsState(colors);
      persistSettings({ customInterfaceColors: colors });
    },
    [persistSettings],
  );

  const setColorBlindMode = useCallback(
    (mode: ColorBlindMode) => {
      setColorBlindModeState(mode);
      persistSettings({ colorBlindMode: mode });
    },
    [persistSettings],
  );

  const setMeasurementUnits = useCallback(
    (mode: MeasurementUnitDisplay) => {
      setMeasurementUnitsState(mode);
      persistSettings({ measurementUnits: mode });
    },
    [persistSettings],
  );

  const setPressureUnits = useCallback(
    (mode: PressureUnitDisplay) => {
      setPressureUnitsState(mode);
      persistSettings({ pressureUnits: mode });
    },
    [persistSettings],
  );

  const setHapticEnabled = useCallback(
    (enabled: boolean) => {
      setHapticEnabledState(enabled);
      persistSettings({ hapticEnabled: enabled });
    },
    [persistSettings],
  );

  const setNotificationsEnabled = useCallback(
    (enabled: boolean) => {
      setNotificationsEnabledState(enabled);
      persistSettings({ notificationsEnabled: enabled });
    },
    [persistSettings],
  );

  const setReminderTime = useCallback(
    (time: string) => {
      setReminderTimeState(time);
      persistSettings({ reminderTime: time });
    },
    [persistSettings],
  );

  const setReminderDays = useCallback(
    (days: number[]) => {
      setReminderDaysState(days);
      persistSettings({ reminderDays: days });
    },
    [persistSettings],
  );

  const setUiFxEnabled = useCallback(
    (enabled: boolean) => {
      setUiFxEnabledState(enabled);
      persistSettings({ uiFxEnabled: enabled });
    },
    [persistSettings],
  );

  const setUiFxCardsEnabled = useCallback(
    (enabled: boolean) => {
      setUiFxCardsEnabledState(enabled);
      persistSettings({ uiFxCardsEnabled: enabled });
    },
    [persistSettings],
  );

  const setUiFxCardTiltEnabled = useCallback(
    (enabled: boolean) => {
      setUiFxCardTiltEnabledState(enabled);
      persistSettings({ uiFxCardTiltEnabled: enabled });
    },
    [persistSettings],
  );

  const setUiFxButtonsEnabled = useCallback(
    (enabled: boolean) => {
      setUiFxButtonsEnabledState(enabled);
      persistSettings({ uiFxButtonsEnabled: enabled });
    },
    [persistSettings],
  );

  const setUiFxGlowEnabled = useCallback(
    (enabled: boolean) => {
      setUiFxGlowEnabledState(enabled);
      persistSettings({ uiFxGlowEnabled: enabled });
    },
    [persistSettings],
  );

  const setUiFxRippleEnabled = useCallback(
    (enabled: boolean) => {
      setUiFxRippleEnabledState(enabled);
      persistSettings({ uiFxRippleEnabled: enabled });
    },
    [persistSettings],
  );

  const setUiFxWallpaperMotionEnabled = useCallback(
    (enabled: boolean) => {
      setUiFxWallpaperMotionEnabledState(enabled);
      persistSettings({ uiFxWallpaperMotionEnabled: enabled });
    },
    [persistSettings],
  );

  const setAROverlay = useCallback(
    (settings: Partial<AROverlaySettings>) => {
      setAROverlayState(prev => {
        const next = mergeDefined(prev, settings);
        persistSettings({ arOverlay: next });
        return next;
      });
    },
    [persistSettings],
  );

  const setOfflineMode = useCallback(
    (settings: Partial<OfflineModeSettings>) => {
      setOfflineModeState(prev => {
        const next = mergeDefined(prev, settings);
        persistSettings({ offlineMode: next });
        return next;
      });
    },
    [persistSettings],
  );

  const setNotificationPreferences = useCallback(
    (settings: Partial<NotificationPreferences>) => {
      setNotificationPreferencesState(prev => {
        const mergedTypes = settings.types ? { ...prev.types, ...settings.types } : prev.types;
        const next = {
          ...mergeDefined(prev, settings),
          types: mergedTypes,
        } as NotificationPreferences;
        persistSettings({ notificationPreferences: next });
        return next;
      });
    },
    [persistSettings],
  );

  const setProfileSettings = useCallback(
    (settings: Partial<ProfileSettings>) => {
      setProfileSettingsState(prev => {
        const next = mergeDefined(prev, settings);
        persistSettings({ profileSettings: next });
        return next;
      });
    },
    [persistSettings],
  );

  const setVoiceGuidance = useCallback(
    (settings: Partial<VoiceGuidanceSettings>) => {
      setVoiceGuidanceState(prev => {
        const next = mergeDefined(prev, settings);
        persistSettings({ voiceGuidance: next });
        return next;
      });
    },
    [persistSettings],
  );

  const setAchievements = useCallback(
    (settings: Partial<AchievementSettings>) => {
      setAchievementsState(prev => {
        const next = mergeDefined(prev, settings);
        persistSettings({ achievements: next });
        return next;
      });
    },
    [persistSettings],
  );

  const setHealthTracking = useCallback(
    (settings: Partial<HealthTrackingSettings>) => {
      setHealthTrackingState(prev => {
        const next = mergeDefined(prev, settings);
        persistSettings({ healthTracking: next });
        return next;
      });
    },
    [persistSettings],
  );

  const setDashboard = useCallback(
    (settings: Partial<DashboardSettings>) => {
      setDashboardState(prev => {
        const next = mergeDefined(prev, settings);
        persistSettings({ dashboard: next });
        return next;
      });
    },
    [persistSettings],
  );

  const setThemeExtended = useCallback(
    (settings: Partial<ThemeExtendedSettings>) => {
      setThemeExtendedState(prev => {
        const next = mergeDefined(prev, settings);
        persistSettings({ themeExtended: next });
        return next;
      });
    },
    [persistSettings],
  );

  const setAPIAccess = useCallback(
    (settings: Partial<APIAccessSettings>) => {
      setApiAccessState(prev => {
        const next = mergeDefined(prev, settings);
        persistSettings({ apiAccess: next });
        return next;
      });
    },
    [persistSettings],
  );

  return (
    <SettingsContext.Provider
      value={{
        theme,
        setTheme,
        themePreset,
        setThemePreset,
        customWallpaper,
        setCustomWallpaper,
        setCustomWallpaperFromFile,
        wallpaperBlur,
        setWallpaperBlur,
        wallpaperOpacity,
        setWallpaperOpacity,
        fontSize,
        setFontSize,
        fontFamily,
        setFontFamily,
        customAccentColor,
        setCustomAccentColor,
        customInterfaceColors,
        setCustomInterfaceColors,
        colorBlindMode,
        setColorBlindMode,
        measurementUnits,
        setMeasurementUnits,
        pressureUnits,
        setPressureUnits,
        hapticEnabled,
        setHapticEnabled,
        notificationsEnabled,
        setNotificationsEnabled,
        reminderTime,
        setReminderTime,
        reminderDays,
        setReminderDays,
        uiFxEnabled,
        setUiFxEnabled,
        uiFxCardsEnabled,
        setUiFxCardsEnabled,
        uiFxCardTiltEnabled,
        setUiFxCardTiltEnabled,
        uiFxButtonsEnabled,
        setUiFxButtonsEnabled,
        uiFxGlowEnabled,
        setUiFxGlowEnabled,
        uiFxRippleEnabled,
        setUiFxRippleEnabled,
        uiFxWallpaperMotionEnabled,
        setUiFxWallpaperMotionEnabled,
        arOverlay,
        setAROverlay,
        offlineMode,
        setOfflineMode,
        notificationPreferences,
        setNotificationPreferences,
        profileSettings,
        setProfileSettings,
        voiceGuidance,
        setVoiceGuidance,
        achievements,
        setAchievements,
        healthTracking,
        setHealthTracking,
        dashboard,
        setDashboard,
        themeExtended,
        setThemeExtended,
        apiAccess,
        setAPIAccess,
        isSyncing,
        syncToCloud,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within SettingsProvider");
  return context;
}

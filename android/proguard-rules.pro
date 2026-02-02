# =============================================================================
# MorphoScan Pro - Root ProGuard Rules
# =============================================================================
# These rules supplement the app-level proguard-rules.pro
# =============================================================================

# -----------------------------------------------------------------------------
# CAPACITOR CORE
# -----------------------------------------------------------------------------

-keep class com.getcapacitor.** { *; }
-keep class com.capacitorjs.** { *; }
-keep class com.morphoscan.pro.** { *; }

# -----------------------------------------------------------------------------
# KOTLIN RUNTIME
# -----------------------------------------------------------------------------

-keep class kotlin.** { *; }
-keep class kotlinx.** { *; }
-dontwarn kotlin.**
-dontwarn kotlinx.**

# -----------------------------------------------------------------------------
# WEBVIEW & JAVASCRIPT BRIDGE
# -----------------------------------------------------------------------------

# Keep JavaScript interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# WebView clients
-keepclassmembers class * extends android.webkit.WebViewClient {
    public void *(android.webkit.WebView, java.lang.String, android.graphics.Bitmap);
    public boolean *(android.webkit.WebView, java.lang.String);
}
-keepclassmembers class * extends android.webkit.WebViewClient {
    public void *(android.webkit.WebView, java.lang.String);
}

# -----------------------------------------------------------------------------
# NATIVE METHODS
# -----------------------------------------------------------------------------

-keepclasseswithmembernames class * {
    native <methods>;
}

# -----------------------------------------------------------------------------
# FIREBASE & GOOGLE SERVICES
# -----------------------------------------------------------------------------

-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# -----------------------------------------------------------------------------
# STRIPE PAYMENTS
# -----------------------------------------------------------------------------

-keep class com.stripe.android.** { *; }
-dontwarn com.stripe.android.**

# -----------------------------------------------------------------------------
# DATABASE & ORM
# -----------------------------------------------------------------------------

# Prevent R8 from removing classes referenced via reflection
-keep class * extends androidx.room.RoomDatabase
-keep @androidx.room.Entity class *

# -----------------------------------------------------------------------------
# SECURITY HARDENING
# -----------------------------------------------------------------------------

# Remove debug logging in release builds
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}

# Aggressive obfuscation
-repackageclasses ''
-allowaccessmodification

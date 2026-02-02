# =============================================================================
# MorphoScan Pro - ProGuard/R8 Security Rules
# =============================================================================
# This configuration provides:
# - Code obfuscation to protect against reverse engineering
# - Removal of unused code (tree shaking)
# - Optimization for performance
# - Security hardening for sensitive data
# =============================================================================

# -----------------------------------------------------------------------------
# SECURITY HARDENING
# -----------------------------------------------------------------------------

# Remove all logging in release builds (prevents info leakage)
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
    public static *** w(...);
    public static *** e(...);
    public static *** wtf(...);
}

# Remove System.out and System.err prints
-assumenosideeffects class java.io.PrintStream {
    public void println(...);
    public void print(...);
}

# Obfuscate class names aggressively
-repackageclasses ''
-allowaccessmodification

# Remove source file names and line numbers (for maximum obfuscation)
# Comment out -keepattributes SourceFile,LineNumberTable for production
# but keep for debugging during development
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Remove debugging attributes
-keepattributes !LocalVariableTable, !LocalVariableTypeTable

# -----------------------------------------------------------------------------
# CAPACITOR & WEBVIEW
# -----------------------------------------------------------------------------

# Keep Capacitor classes
-keep class com.getcapacitor.** { *; }
-keep class com.capacitorjs.** { *; }
-dontwarn com.getcapacitor.**

# Keep JavaScript interface for WebView bridge
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep WebView client methods
-keepclassmembers class * extends android.webkit.WebViewClient {
    public void *(android.webkit.WebView, java.lang.String, android.graphics.Bitmap);
    public boolean *(android.webkit.WebView, java.lang.String);
    public void *(android.webkit.WebView, java.lang.String);
}

-keepclassmembers class * extends android.webkit.WebChromeClient {
    public void *(android.webkit.WebView, java.lang.String);
}

# -----------------------------------------------------------------------------
# APP-SPECIFIC CLASSES
# -----------------------------------------------------------------------------

# Keep custom application class
-keep class com.morphoscan.pro.** { *; }

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# -----------------------------------------------------------------------------
# ANDROID FRAMEWORK
# -----------------------------------------------------------------------------

# Keep Parcelable implementations
-keep class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}

# Keep Serializable classes
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# Keep enum values
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# Keep R class members
-keepclassmembers class **.R$* {
    public static <fields>;
}

# -----------------------------------------------------------------------------
# ANDROIDX LIBRARIES
# -----------------------------------------------------------------------------

# Keep AndroidX classes
-keep class androidx.** { *; }
-dontwarn androidx.**

# Keep CameraX classes
-keep class androidx.camera.** { *; }
-dontwarn androidx.camera.**

# Keep biometric classes
-keep class androidx.biometric.** { *; }
-dontwarn androidx.biometric.**

# Keep security crypto classes (for encrypted storage)
-keep class androidx.security.** { *; }
-keep class androidx.security.crypto.** { *; }
-dontwarn androidx.security.**

# -----------------------------------------------------------------------------
# FIREBASE & GOOGLE PLAY SERVICES
# -----------------------------------------------------------------------------

# Keep Firebase classes
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# Firebase Messaging
-keep class com.google.firebase.messaging.** { *; }
-keepclassmembers class com.google.firebase.messaging.** { *; }

# -----------------------------------------------------------------------------
# STRIPE (if used)
# -----------------------------------------------------------------------------

-keep class com.stripe.android.** { *; }
-dontwarn com.stripe.android.**

# -----------------------------------------------------------------------------
# REFLECTION & JSON
# -----------------------------------------------------------------------------

# Keep GSON model classes (if using GSON)
-keepattributes Signature
-keepattributes *Annotation*

# Keep classes that might be accessed via reflection
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}

# -----------------------------------------------------------------------------
# CRYPTO & SECURITY
# -----------------------------------------------------------------------------

# Keep crypto classes for secure storage
-keep class javax.crypto.** { *; }
-keep class java.security.** { *; }
-dontwarn javax.crypto.**
-dontwarn java.security.**

# Keep Conscrypt (if used for TLS)
-keep class org.conscrypt.** { *; }
-dontwarn org.conscrypt.**

# -----------------------------------------------------------------------------
# OPTIMIZATION SETTINGS
# -----------------------------------------------------------------------------

# Optimization iterations
-optimizationpasses 5

# Don't note about potential issues
-dontnote **

# Allow methods with unused parameters to be optimized
-optimizations !code/simplification/arithmetic,!code/simplification/cast,!field/*,!class/merging/*

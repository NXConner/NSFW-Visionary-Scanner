package com.morphoscan.pro;

import android.content.pm.ApplicationInfo;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Ensure we switch off the launch/splash theme immediately.
        // Some OEM builds can otherwise linger on the splash background and appear "blank"
        // even while the WebView is loading.
        setTheme(R.style.AppTheme_NoActionBar);
        super.onCreate(savedInstanceState);

        // Enable remote WebView debugging for debug builds only.
        try {
            if ((getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0) {
                WebView.setWebContentsDebuggingEnabled(true);
            }
        } catch (Exception ignored) {
            // ignore
        }

        configureWebViewForDeviceCompatibility();
    }

    private void configureWebViewForDeviceCompatibility() {
        Bridge bridge = getBridge();
        if (bridge == null) {
            return;
        }

        WebView webView = bridge.getWebView();
        if (webView == null) {
            return;
        }

        WebSettings settings = webView.getSettings();
        if (settings == null) {
            return;
        }

        // Defensive duplicate of core settings to avoid OEM WebView defaults causing
        // stuck loading states on some Android builds.
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        // Some WebView builds require database storage to be explicitly enabled for
        // IndexedDB/localStorage-heavy apps to behave consistently.
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setLoadsImagesAutomatically(true);
    }
}

package com.morphoscan.pro;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Enable Chrome devtools inspection for debug builds.
        // This is critical for diagnosing "blank WebView" issues on real devices.
        try {
            if (BuildConfig.DEBUG) {
                WebView.setWebContentsDebuggingEnabled(true);
            }
        } catch (Throwable ignored) {
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
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setLoadsImagesAutomatically(true);
    }
}

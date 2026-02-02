package com.morphoscan.pro;

import android.os.Bundle;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    
    // Configure WebView for camera access
    WebView webView = getBridge().getWebView();
    if (webView != null) {
      WebSettings settings = webView.getSettings();
      
      // Enable JavaScript (required for Capacitor)
      settings.setJavaScriptEnabled(true);
      
      // Enable DOM storage (required for modern web apps)
      settings.setDomStorageEnabled(true);
      
      // Enable database storage
      settings.setDatabaseEnabled(true);
      
      // Allow file access (for camera/media)
      settings.setAllowFileAccess(true);
      settings.setAllowContentAccess(true);
      
      // Enable media playback
      settings.setMediaPlaybackRequiresUserGesture(false);
      
      // Set WebChromeClient for camera permissions
      webView.setWebChromeClient(new WebChromeClient() {
        @Override
        public void onPermissionRequest(android.webkit.PermissionRequest request) {
          // Grant camera and microphone permissions
          String[] resources = request.getResources();
          for (String resource : resources) {
            if (android.webkit.PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource) ||
                android.webkit.PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource)) {
              request.grant(new String[]{resource});
              break;
            }
          }
        }
      });
    }
  }
}


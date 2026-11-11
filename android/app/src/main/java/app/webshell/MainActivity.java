package app.webshell;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ContentValues;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.MimeTypeMap;
import android.webkit.ServiceWorkerClient;
import android.webkit.ServiceWorkerController;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Hosts the bundled web app in a WebView. The web files live in the APK
 * under assets/www and are served from a private https origin, so storage,
 * service workers and the clipboard behave as they do on the real site and
 * the app works with no connection.
 */
public class MainActivity extends Activity {

    static final String HOST = "appassets.androidplatform.net";
    static final String ORIGIN = "https://" + HOST;
    private static final int REQ_FILE = 41;

    private WebView web;
    private WebViewAssetLoader assets;
    private ValueCallback<Uri[]> fileCallback;
    private final Set<String> inAppHosts = new HashSet<>();

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        for (String h : BuildConfig.LIVE_HOSTS.split(",")) {
            if (!h.trim().isEmpty()) inAppHosts.add(h.trim().toLowerCase(Locale.ROOT));
        }

        assets = new WebViewAssetLoader.Builder()
                .setDomain(HOST)
                .addPathHandler("/", new WwwHandler())
                .build();

        web = new WebView(this);
        web.setBackgroundColor(getColor(R.color.shell_bg));
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setSupportMultipleWindows(false);
        s.setBuiltInZoomControls(false);
        s.setUserAgentString(s.getUserAgentString() + " WebShell/1.0" + (BuildConfig.QUEST ? " Quest" : ""));
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.addJavascriptInterface(new Bridge(), "AndroidShell");

        if (WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) {
            WebViewCompat.addDocumentStartJavaScript(web, BOOT_JS(), Collections.singleton(ORIGIN));
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            ServiceWorkerController.getInstance().setServiceWorkerClient(new ServiceWorkerClient() {
                @Override
                public WebResourceResponse shouldInterceptRequest(WebResourceRequest request) {
                    return assets.shouldInterceptRequest(request.getUrl());
                }
            });
        }

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return assets.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return handleNavigation(request.getUrl());
            }

            @Override
            public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
                if (!WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) {
                    view.evaluateJavascript(BOOT_JS(), null);
                }
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                view.evaluateJavascript(
                        "(function(){var m=document.querySelector('meta[name=theme-color]');"
                                + "return m?m.content:getComputedStyle(document.body).backgroundColor})()",
                        v -> applyBarColor(v == null ? "" : v.replace("\"", "")));
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                Intent pick = new Intent(Intent.ACTION_GET_CONTENT);
                pick.addCategory(Intent.CATEGORY_OPENABLE);
                pick.setType("*/*");
                String[] types = params.getAcceptTypes();
                if (types != null && types.length > 0 && types[0] != null && types[0].contains("/")) {
                    pick.putExtra(Intent.EXTRA_MIME_TYPES, types);
                }
                try {
                    startActivityForResult(Intent.createChooser(pick, "Choose a file"), REQ_FILE);
                } catch (ActivityNotFoundException e) {
                    fileCallback = null;
                    callback.onReceiveValue(null);
                    toast("No file picker is available on this device.");
                }
                return true;
            }
        });

        if (savedInstanceState != null) {
            web.restoreState(savedInstanceState);
        } else {
            web.loadUrl(ORIGIN + "/" + BuildConfig.START_PATH);
        }
    }

    /** true = handled here, false = let the WebView load it. */
    private boolean handleNavigation(Uri uri) {
        String scheme = uri.getScheme() == null ? "" : uri.getScheme();
        String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase(Locale.ROOT);
        if (HOST.equals(host)) {
            String path = uri.getPath() == null ? "" : uri.getPath();
            if (path.toLowerCase(Locale.ROOT).endsWith(".pdf")) {
                Intent i = new Intent(this, PdfActivity.class);
                i.putExtra(PdfActivity.EXTRA_ASSET, "www" + path);
                startActivity(i);
                return true;
            }
            return false;
        }
        if ((scheme.equals("https") || scheme.equals("http")) && inAppHosts.contains(host)) return false;
        if (scheme.equals("blob") || scheme.equals("data") || scheme.equals("about")) return false;
        openExternal(uri);
        return true;
    }

    private void openExternal(Uri uri) {
        try {
            Intent i = new Intent(Intent.ACTION_VIEW, uri);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(i);
        } catch (Exception e) {
            toast("Nothing on this device can open that link.");
        }
    }

    private void applyBarColor(String css) {
        try {
            int c;
            css = css.trim();
            if (css.startsWith("rgb")) {
                String[] p = css.replaceAll("[^0-9,.]", "").split(",");
                c = Color.rgb((int) Float.parseFloat(p[0]), (int) Float.parseFloat(p[1]), (int) Float.parseFloat(p[2]));
            } else {
                c = Color.parseColor(css);
            }
            getWindow().setStatusBarColor(c);
            getWindow().setNavigationBarColor(c);
            boolean light = (0.299 * Color.red(c) + 0.587 * Color.green(c) + 0.114 * Color.blue(c)) > 160;
            int flags = 0;
            if (light) {
                flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
            }
            getWindow().getDecorView().setSystemUiVisibility(flags);
        } catch (Exception ignored) {
        }
    }

    private void toast(String msg) {
        runOnUiThread(() -> Toast.makeText(this, msg, Toast.LENGTH_LONG).show());
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != REQ_FILE || fileCallback == null) return;
        Uri[] result = null;
        if (resultCode == RESULT_OK && data != null && data.getData() != null) {
            result = new Uri[]{data.getData()};
        }
        fileCallback.onReceiveValue(result);
        fileCallback = null;
    }

    /** Back: let the page close a sheet or dialog first, then history, then leave. */
    @Override
    public void onBackPressed() {
        web.evaluateJavascript(
                "(function(){try{return !!(window.__nativeBack&&window.__nativeBack())}catch(e){return false}})()",
                handled -> {
                    if ("true".equals(handled)) return;
                    if (web.canGoBack()) web.goBack();
                    else moveTaskToBack(true);
                });
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        web.saveState(outState);
    }

    @Override
    protected void onPause() {
        super.onPause();
        web.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.onResume();
    }

    @Override
    protected void onDestroy() {
        web.destroy();
        super.onDestroy();
    }

    /** Serves assets/www, mapping folder URLs to index.html. */
    private class WwwHandler implements WebViewAssetLoader.PathHandler {
        private final Map<String, String> mime = new HashMap<>();

        WwwHandler() {
            String[][] m = {
                    {"html", "text/html"}, {"htm", "text/html"}, {"js", "text/javascript"},
                    {"mjs", "text/javascript"}, {"css", "text/css"}, {"json", "application/json"},
                    {"webmanifest", "application/manifest+json"}, {"svg", "image/svg+xml"},
                    {"png", "image/png"}, {"jpg", "image/jpeg"}, {"jpeg", "image/jpeg"},
                    {"webp", "image/webp"}, {"gif", "image/gif"}, {"ico", "image/x-icon"},
                    {"woff2", "font/woff2"}, {"woff", "font/woff"}, {"ttf", "font/ttf"},
                    {"pdf", "application/pdf"}, {"wasm", "application/wasm"}, {"txt", "text/plain"},
                    {"mp3", "audio/mpeg"}, {"mp4", "video/mp4"}, {"webm", "video/webm"}, {"xml", "text/xml"}
            };
            for (String[] e : m) mime.put(e[0], e[1]);
        }

        @Override
        public WebResourceResponse handle(String path) {
            if (path.isEmpty() || path.endsWith("/")) path += "index.html";
            try {
                InputStream in = getAssets().open("www/" + path);
                int dot = path.lastIndexOf('.');
                String ext = dot < 0 ? "" : path.substring(dot + 1).toLowerCase(Locale.ROOT);
                String type = mime.get(ext);
                if (type == null) type = MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext);
                if (type == null) type = "application/octet-stream";
                boolean text = type.startsWith("text/") || type.contains("json") || type.contains("xml");
                return new WebResourceResponse(type, text ? "utf-8" : null, in);
            } catch (Exception e) {
                return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found",
                        Collections.emptyMap(), new java.io.ByteArrayInputStream(new byte[0]));
            }
        }
    }

    /** Methods the page can call as window.AndroidShell.*. */
    private class Bridge {
        @JavascriptInterface
        public boolean isQuest() {
            return BuildConfig.QUEST;
        }

        @JavascriptInterface
        public String version() {
            return BuildConfig.VERSION_NAME;
        }

        /** Save a file the page generated (backup, export) to Downloads. */
        @JavascriptInterface
        public void saveFile(String name, String mimeType, String base64) {
            try {
                byte[] bytes = Base64.decode(base64, Base64.DEFAULT);
                String safe = name == null || name.isEmpty() ? "download" : name.replaceAll("[\\\\/:*?\"<>|]", "_");
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    ContentValues v = new ContentValues();
                    v.put(MediaStore.Downloads.DISPLAY_NAME, safe);
                    if (mimeType != null && !mimeType.isEmpty()) v.put(MediaStore.Downloads.MIME_TYPE, mimeType);
                    v.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
                    Uri uri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
                    if (uri == null) throw new IllegalStateException("no uri");
                    try (OutputStream out = getContentResolver().openOutputStream(uri)) {
                        out.write(bytes);
                    }
                    toast("Saved to Downloads: " + safe);
                } else {
                    File dir = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                    File f = new File(dir, safe);
                    try (OutputStream out = new FileOutputStream(f)) {
                        out.write(bytes);
                    }
                    toast("Saved: " + f.getAbsolutePath());
                }
            } catch (Exception e) {
                toast("Could not save the file.");
            }
        }

        @JavascriptInterface
        public void share(String title, String text) {
            Intent i = new Intent(Intent.ACTION_SEND);
            i.setType("text/plain");
            i.putExtra(Intent.EXTRA_SUBJECT, title);
            i.putExtra(Intent.EXTRA_TEXT, text);
            startActivity(Intent.createChooser(i, title));
        }

        @JavascriptInterface
        public void openExternal(String url) {
            runOnUiThread(() -> MainActivity.this.openExternal(Uri.parse(url)));
        }

        @JavascriptInterface
        public void keepAwake(boolean on) {
            runOnUiThread(() -> {
                if (on) getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            });
        }

        @JavascriptInterface
        public void setBarColor(String css) {
            runOnUiThread(() -> applyBarColor(css));
        }
    }

    /**
     * Runs before the page's own scripts. Marks the document so the page's
     * CSS/JS can adapt (html.native-app, html.quest, window.NATIVE_APP) and
     * routes generated-file downloads to the bridge, since a WebView cannot
     * save blob: links by itself.
     */
    private static String BOOT_JS() {
        return "(function(){if(window.NATIVE_APP)return;"
                + "var q=" + (BuildConfig.QUEST ? "true" : "false") + ";"
                + "window.NATIVE_APP={platform:'android',quest:q};"
                + "var de=document.documentElement;de.classList.add('native-app');if(q)de.classList.add('quest');"
                + "var blobs={};var oc=URL.createObjectURL;"
                + "URL.createObjectURL=function(b){var u=oc.apply(URL,arguments);try{if(b instanceof Blob)blobs[u]=b}catch(e){}return u};"
                + "var orv=URL.revokeObjectURL;"
                + "URL.revokeObjectURL=function(u){setTimeout(function(){delete blobs[u]},30000);return orv.apply(URL,arguments)};"
                + "function send(name,blob){var r=new FileReader();r.onload=function(){var s=String(r.result);"
                + "AndroidShell.saveFile(name||'download',blob.type||'',s.slice(s.indexOf(',')+1))};r.readAsDataURL(blob)}"
                + "function take(a){if(!a||!a.hasAttribute||!a.hasAttribute('download'))return false;"
                + "var h=a.href||'';if(h.indexOf('blob:')!==0&&h.indexOf('data:')!==0)return false;"
                + "var n=a.getAttribute('download');"
                + "if(blobs[h])send(n,blobs[h]);else fetch(h).then(function(r){return r.blob()}).then(function(b){send(n,b)}).catch(function(){});"
                + "return true}"
                + "var ck=HTMLAnchorElement.prototype.click;"
                + "HTMLAnchorElement.prototype.click=function(){if(take(this))return;return ck.apply(this,arguments)};"
                + "document.addEventListener('click',function(e){var a=e.target&&e.target.closest&&e.target.closest('a[download]');"
                + "if(a&&take(a)){e.preventDefault();e.stopPropagation()}},true);"
                + "})();";
    }
}

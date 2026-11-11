package app.webshell;

import android.app.Activity;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.pdf.PdfRenderer;
import android.os.Bundle;
import android.os.ParcelFileDescriptor;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.Button;
import android.widget.HorizontalScrollView;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ListView;
import android.widget.TextView;
import android.widget.Toast;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;

/**
 * Built-in viewer for PDFs bundled with the app, so documents open on any
 * device - including a headset with no PDF app installed - and offline.
 */
public class PdfActivity extends Activity {

    static final String EXTRA_ASSET = "asset";
    private static final float[] ZOOMS = {1f, 1.5f, 2f, 3f};

    private PdfRenderer renderer;
    private ParcelFileDescriptor fd;
    private ListView list;
    private int zoomIndex = 0;
    private TextView zoomLabel;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        String asset = getIntent().getStringExtra(EXTRA_ASSET);
        try {
            File out = new File(getCacheDir(), "view.pdf");
            try (InputStream in = getAssets().open(asset); OutputStream os = new FileOutputStream(out)) {
                byte[] buf = new byte[65536];
                int n;
                while ((n = in.read(buf)) > 0) os.write(buf, 0, n);
            }
            fd = ParcelFileDescriptor.open(out, ParcelFileDescriptor.MODE_READ_ONLY);
            renderer = new PdfRenderer(fd);
        } catch (Exception e) {
            Toast.makeText(this, "Could not open this document.", Toast.LENGTH_LONG).show();
            finish();
            return;
        }

        int pad = dp(8);
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(getColor(R.color.shell_bg));

        LinearLayout bar = new LinearLayout(this);
        bar.setGravity(Gravity.CENTER_VERTICAL);
        bar.setPadding(pad, pad, pad, pad);
        Button close = button("←  Back");
        close.setOnClickListener(v -> finish());
        TextView title = new TextView(this);
        String name = asset.substring(asset.lastIndexOf('/') + 1);
        title.setText(name + "  ·  " + renderer.getPageCount() + " pages");
        title.setTextColor(Color.WHITE);
        title.setSingleLine(true);
        title.setPadding(pad * 2, 0, pad, 0);
        Button minus = button("−");
        Button plus = button("+");
        zoomLabel = new TextView(this);
        zoomLabel.setTextColor(Color.WHITE);
        zoomLabel.setPadding(pad, 0, pad, 0);
        minus.setOnClickListener(v -> setZoom(zoomIndex - 1));
        plus.setOnClickListener(v -> setZoom(zoomIndex + 1));
        bar.addView(close);
        bar.addView(title, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1));
        bar.addView(minus);
        bar.addView(zoomLabel);
        bar.addView(plus);
        root.addView(bar);

        list = new ListView(this);
        list.setDividerHeight(dp(8));
        list.setBackgroundColor(0xFF2A2F3A);
        list.setAdapter(new Pages());
        HorizontalScrollView hs = new HorizontalScrollView(this);
        hs.setFillViewport(true);
        hs.addView(list, new ViewGroup.LayoutParams(pageWidth(), ViewGroup.LayoutParams.MATCH_PARENT));
        root.addView(hs, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1));
        setContentView(root);
        setZoom(0);
    }

    private Button button(String text) {
        Button b = new Button(this);
        b.setText(text);
        b.setAllCaps(false);
        b.setMinWidth(dp(56));
        b.setMinHeight(dp(48));
        return b;
    }

    private int dp(int v) {
        return (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, getResources().getDisplayMetrics());
    }

    private int pageWidth() {
        return (int) (getResources().getDisplayMetrics().widthPixels * ZOOMS[zoomIndex]);
    }

    private void setZoom(int i) {
        zoomIndex = Math.max(0, Math.min(ZOOMS.length - 1, i));
        zoomLabel.setText((int) (ZOOMS[zoomIndex] * 100) + "%");
        ViewGroup.LayoutParams lp = list.getLayoutParams();
        lp.width = pageWidth();
        list.setLayoutParams(lp);
        ((BaseAdapter) list.getAdapter()).notifyDataSetChanged();
    }

    private class Pages extends BaseAdapter {
        @Override
        public int getCount() {
            return renderer.getPageCount();
        }

        @Override
        public Object getItem(int position) {
            return position;
        }

        @Override
        public long getItemId(int position) {
            return position;
        }

        @Override
        public View getView(int position, View convertView, ViewGroup parent) {
            ImageView iv = convertView instanceof ImageView ? (ImageView) convertView : new ImageView(PdfActivity.this);
            iv.setAdjustViewBounds(true);
            iv.setBackgroundColor(Color.WHITE);
            PdfRenderer.Page page = renderer.openPage(position);
            // Cap the bitmap so a zoomed page cannot exhaust memory.
            int w = Math.min(pageWidth(), 2400);
            int pw = Math.max(1, page.getWidth()), ph = page.getHeight();
            int h = Math.max(1, (int) ((long) w * ph / pw));
            Bitmap bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
            bmp.eraseColor(Color.WHITE);
            page.render(bmp, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY);
            page.close();
            iv.setImageBitmap(bmp);
            iv.setLayoutParams(new ListView.LayoutParams(pageWidth(), (int) ((long) pageWidth() * ph / pw)));
            return iv;
        }
    }

    @Override
    protected void onDestroy() {
        try {
            if (renderer != null) renderer.close();
            if (fd != null) fd.close();
        } catch (Exception ignored) {
        }
        super.onDestroy();
    }
}

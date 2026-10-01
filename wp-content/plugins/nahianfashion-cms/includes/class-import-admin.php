<?php
defined('ABSPATH') || exit;

/**
 * Tools -> Nahian Fashion Import: browser-based importer for hosting without SSH/WP-CLI (cPanel).
 * Upload a pg_dump .sql (or drop it into wp-content/uploads/nf-import/ by FTP) and run the steps; every request
 * processes a few rows within a time budget, so it works with short PHP execution limits and can be resumed.
 */
class NF_Import_Admin {
    public static function init(): void {
        add_action('admin_menu', [__CLASS__, 'menu']);
        add_action('admin_post_nf_import_upload', [__CLASS__, 'upload']);
        add_action('admin_post_nf_import_delete', [__CLASS__, 'delete']);
        add_action('wp_ajax_nf_import_plan', [__CLASS__, 'ajax_plan']);
        add_action('wp_ajax_nf_import_step', [__CLASS__, 'ajax_step']);
        add_action('wp_ajax_nf_import_setup', [__CLASS__, 'ajax_setup']);
    }

    public static function dir(): string {
        $d = trailingslashit(wp_upload_dir()['basedir']) . 'nf-import';
        if (!is_dir($d)) {
            wp_mkdir_p($d);
            file_put_contents($d . '/.htaccess', "Require all denied\nDeny from all\n");
            file_put_contents($d . '/index.php', "<?php // Silence is golden.\n");
        }
        return $d;
    }

    private static function files(): array {
        $out = [];
        foreach (glob(self::dir() . '/*.sql') ?: [] as $f) {
            $out[basename($f)] = size_format(filesize($f)) . ' · ' . gmdate('Y-m-d H:i', filemtime($f)) . ' UTC';
        }
        return $out;
    }

    public static function menu(): void {
        add_management_page('Nahian Fashion Import', 'Nahian Fashion Import', 'manage_options', 'nf-import', [__CLASS__, 'page']);
    }

    public static function upload(): void {
        check_admin_referer('nf_import_upload');
        if (!current_user_can('manage_options')) {
            wp_die('Forbidden', 403);
        }
        $f = $_FILES['dump'] ?? null;
        if (!$f || $f['error'] !== UPLOAD_ERR_OK || strtolower(pathinfo($f['name'], PATHINFO_EXTENSION)) !== 'sql') {
            wp_safe_redirect(add_query_arg(['page' => 'nf-import', 'msg' => 'upload_failed'], admin_url('tools.php')));
            exit;
        }
        move_uploaded_file($f['tmp_name'], self::dir() . '/dump-' . gmdate('Ymd-His') . '-' . wp_generate_password(10, false) . '.sql');
        wp_safe_redirect(add_query_arg(['page' => 'nf-import', 'msg' => 'uploaded'], admin_url('tools.php')));
        exit;
    }

    public static function delete(): void {
        check_admin_referer('nf_import_delete');
        if (!current_user_can('manage_options')) {
            wp_die('Forbidden', 403);
        }
        $name = basename((string) ($_POST['file'] ?? ''));
        $path = self::dir() . '/' . $name;
        if ($name !== '' && substr($name, -4) === '.sql' && is_file($path)) {
            unlink($path);
        }
        wp_safe_redirect(add_query_arg(['page' => 'nf-import', 'msg' => 'deleted'], admin_url('tools.php')));
        exit;
    }

    private static function resolve(): ?string {
        $name = basename((string) ($_POST['file'] ?? ''));
        $path = self::dir() . '/' . $name;
        return ($name !== '' && substr($name, -4) === '.sql' && is_file($path)) ? $path : null;
    }

    private static function guard(): void {
        check_ajax_referer('nf_import');
        if (!current_user_can('manage_options')) {
            wp_send_json_error('Forbidden', 403);
        }
        @set_time_limit(120);
    }

    public static function ajax_plan(): void {
        self::guard();
        $path = self::resolve();
        if (!$path) { wp_send_json_error('File not found'); }
        $imp = new NF_Importer($path);
        $plan = [];
        foreach (NF_Importer::STEPS as $step => $def) {
            $plan[$step] = ['label' => $def[0], 'total' => $imp->count($step)];
        }
        wp_send_json_success($plan);
    }

    public static function ajax_step(): void {
        self::guard();
        $path = self::resolve();
        $step = (string) ($_POST['step'] ?? '');
        if (!$path || !isset(NF_Importer::STEPS[$step])) { wp_send_json_error('Bad request'); }
        $max = (int) ini_get('max_execution_time');
        $budget = $max > 0 ? max(5.0, min(20.0, $max * 0.5)) : 20.0;
        $imp = new NF_Importer($path);
        $r = $imp->run_step($step, max(0, (int) ($_POST['offset'] ?? 0)), $budget);
        $r['warnings'] = array_merge($imp->warnings, array_map(static fn($u) => 'Image not imported: ' . $u, NF_Media::$failed));
        if ($r['done']) { flush_rewrite_rules(false); }
        wp_send_json_success($r);
    }

    public static function ajax_setup(): void {
        self::guard();
        NF_Setup::run();
        wp_send_json_success('ok');
    }

    public static function page(): void {
        $files = self::files();
        $msg = sanitize_key($_GET['msg'] ?? '');
        $nonce = wp_create_nonce('nf_import');
        ?>
<div class="wrap" id="nf-import">
  <h1>Nahian Fashion Import</h1>
  <?php if ($msg) : ?><div class="notice notice-<?php echo $msg === 'upload_failed' ? 'error' : 'success'; ?> is-dismissible"><p><?php echo esc_html(['uploaded' => 'File uploaded.', 'deleted' => 'File deleted.', 'upload_failed' => 'Upload failed (a .sql file is required; check the PHP upload limit, or copy the file by FTP into wp-content/uploads/nf-import/).'][$msg] ?? ''); ?></p></div><?php endif; ?>
  <p>Imports products, categories, pages, banners, coupons, reviews and (optionally) orders from a PostgreSQL <code>pg_dump</code> file. Images are downloaded into the Media Library. You can run it again at any time: records are updated, not duplicated.</p>

  <h2>1. Dump file</h2>
  <form method="post" enctype="multipart/form-data" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
    <input type="hidden" name="action" value="nf_import_upload" />
    <?php wp_nonce_field('nf_import_upload'); ?>
    <input type="file" name="dump" accept=".sql" required /> <button class="button">Upload</button>
    <p class="description">Max upload size: <?php echo esc_html(size_format(wp_max_upload_size())); ?>. Larger file? Copy it by FTP to <code>wp-content/uploads/nf-import/</code>.</p>
  </form>
  <?php if ($files) : ?>
    <table class="widefat striped" style="max-width:720px;margin-top:12px"><tbody>
      <?php foreach ($files as $name => $meta) : ?>
        <tr>
          <td><label><input type="radio" name="nf-file" value="<?php echo esc_attr($name); ?>" <?php checked($name, array_key_last($files)); ?> /> <code><?php echo esc_html($name); ?></code></label></td>
          <td><?php echo esc_html($meta); ?></td>
          <td>
            <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" onsubmit="return confirm('Delete this file?');" style="margin:0">
              <input type="hidden" name="action" value="nf_import_delete" /><input type="hidden" name="file" value="<?php echo esc_attr($name); ?>" />
              <?php wp_nonce_field('nf_import_delete'); ?><button class="button-link-delete">Delete</button>
            </form>
          </td>
        </tr>
      <?php endforeach; ?>
    </tbody></table>
    <p class="description">The dump may contain customer data: delete it when the import is finished.</p>

    <h2>2. What to import</h2>
    <div id="nf-steps"></div>
    <p><button class="button button-primary" id="nf-start">Start import</button> <button class="button" id="nf-setup">Apply recommended store settings only</button></p>
    <div id="nf-progress" style="max-width:720px"></div>
    <pre id="nf-log" style="max-width:720px;max-height:260px;overflow:auto;background:#fff;border:1px solid #ccd0d4;padding:8px;display:none"></pre>
  <?php else : ?>
    <p><em>No dump uploaded yet.</em></p>
  <?php endif; ?>
</div>
<script>
(function () {
  var NONCE = <?php echo wp_json_encode($nonce); ?>, AJAX = <?php echo wp_json_encode(admin_url('admin-ajax.php')); ?>;
  var $ = function (s) { return document.querySelector(s); };
  if (!$('#nf-start')) return;
  function file() { var r = document.querySelector('input[name=nf-file]:checked'); return r ? r.value : ''; }
  function post(action, data) {
    var fd = new FormData(); fd.append('action', action); fd.append('_ajax_nonce', NONCE); fd.append('file', file());
    Object.keys(data || {}).forEach(function (k) { fd.append(k, data[k]); });
    return fetch(AJAX, { method: 'POST', body: fd, credentials: 'same-origin' }).then(function (r) { return r.json(); });
  }
  function log(m) { var l = $('#nf-log'); l.style.display = 'block'; l.textContent += m + '\n'; l.scrollTop = l.scrollHeight; }
  var plan = null;
  function loadPlan() {
    post('nf_import_plan').then(function (j) {
      if (!j.success) { $('#nf-steps').textContent = 'Could not read the file.'; return; }
      plan = j.data; var h = '';
      Object.keys(plan).forEach(function (s) {
        var checked = (s === 'orders' ? plan[s].total > 0 : true) && plan[s].total > 0;
        h += '<label style="display:block;margin:2px 0"><input type="checkbox" class="nf-step" value="' + s + '" ' + (checked ? 'checked' : '') + (plan[s].total ? '' : ' disabled') + '> ' + plan[s].label + ' <span class="description">(' + plan[s].total + ' rows)</span></label>';
      });
      $('#nf-steps').innerHTML = h;
    });
  }
  document.querySelectorAll('input[name=nf-file]').forEach(function (r) { r.addEventListener('change', loadPlan); });
  loadPlan();

  var running = false;
  $('#nf-setup').addEventListener('click', function () { post('nf_import_setup').then(function () { log('Store settings applied.'); }); });
  $('#nf-start').addEventListener('click', function () {
    if (running) return;
    var steps = Array.prototype.slice.call(document.querySelectorAll('.nf-step:checked')).map(function (c) { return c.value; });
    if (!steps.length) return;
    running = true; this.disabled = true; $('#nf-progress').innerHTML = ''; $('#nf-log').textContent = '';
    var i = 0;
    function next() {
      if (i >= steps.length) { log('Finished.'); running = false; $('#nf-start').disabled = false; return; }
      var s = steps[i], bar = document.createElement('div');
      bar.innerHTML = '<strong>' + plan[s].label + '</strong> <span></span><div style="background:#ddd;height:10px;border-radius:5px"><div style="background:#2271b1;height:10px;width:0;border-radius:5px"></div></div>';
      $('#nf-progress').appendChild(bar);
      (function run(offset) {
        post('nf_import_step', { step: s, offset: offset }).then(function (j) {
          if (!j.success) { log('Error in ' + s + ': ' + (j.data || 'request failed')); i++; return next(); }
          var d = j.data, pct = d.total ? Math.round(d.next / d.total * 100) : 100;
          bar.querySelector('span').textContent = d.next + ' / ' + d.total;
          bar.querySelector('div > div').style.width = pct + '%';
          (d.warnings || []).forEach(log);
          if (d.done) { i++; next(); } else { run(d.next); }
        }).catch(function () { log('Network/timeout error — retrying ' + s + ' from row ' + offset); setTimeout(function () { run(offset); }, 3000); });
      })(0);
    }
    next();
  });
})();
</script>
        <?php
    }
}

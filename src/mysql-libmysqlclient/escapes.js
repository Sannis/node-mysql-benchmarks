#!/usr/bin/env node
require('./_common')(function(env) {
  var conn = env.do_init(function() {
    var cfg = env.cfg,
        results,
        start_time,
        total_time,
        i = 0,
        escaped_string;

    start_time = Date.now();

    for (i = 0; i < cfg.escape_count; ++i)
      escaped_string = conn.escapeSync(cfg.string_to_escape);

    total_time = (Date.now() - start_time) / 1000;

    conn.closeSync();

    results = Math.round(cfg.escape_count / total_time);
    process.stdout.write(JSON.stringify(results));
  }, false);
});

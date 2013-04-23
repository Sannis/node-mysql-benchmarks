#!/usr/bin/env node
require('./_common')(function(env) {
  var conn = env.do_init(function() {
    var cfg = env.cfg,
        results,
        start_time,
        total_time,
        i = 0;

    start_time = Date.now();

    function insertAsync() {
      ++i;
      if (i <= cfg.insert_rows_count) {
        conn.query(cfg.insert_query, function(err) {
          if (err)
            console.error(err);
          insertAsync();
        });
      } else {
        total_time = (Date.now() - start_time) / 1000;

        results = Math.round(cfg.insert_rows_count / total_time);

        conn.closeSync();

        process.stdout.write(JSON.stringify(results));
      }
    }

    insertAsync();
  });
});

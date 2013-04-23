#!/usr/bin/env node
require('./_common')(function(env) {
  var conn = env.do_init(function() {
    var cfg = env.cfg,
        results,
        start_time,
        total_time;

    start_time = Date.now();

    var rows = [];
    conn.query(cfg.select_query, cfg.use_array_rows)
        .on('result', function(r) {
          r.on('error', function(err) {
            console.error(err);
          })
          .on('row', function(row) {
            rows.push(row);
          })
          .on('end', function() {
            total_time = (Date.now() - start_time) / 1000;

            if (rows.length !== cfg.insert_rows_count) {
              console.error('Got ' + rows.length + ' rows, expected '
                            + cfg.insert_rows_count);
            } else {
              results = Math.round(cfg.insert_rows_count / total_time);
              process.stdout.write(JSON.stringify(results));
            }

            conn.end();
          });
        })
        .on('error', function(err) {
          console.error(err);
        })
  }, false);
});

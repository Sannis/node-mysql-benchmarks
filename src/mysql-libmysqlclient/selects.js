#!/usr/bin/env node
require('./_common')(function(env) {
  var cfg = env.cfg;

  var conn = env.do_init(function() {
    var results,
        start_time,
        total_time;

    start_time = Date.now();

    var rows = [];
    conn.query(cfg.select_query, function(err, res) {
      if (err)
        console.error(err);

      while (row = res.fetchRowSync({ asArray: cfg.use_array_rows }))
        rows.push(row);

      total_time = (Date.now() - start_time) / 1000;

      if (rows.length !== cfg.insert_rows_count) {
        console.error('Got ' + rows.length + ' rows, expected '
                      + cfg.insert_rows_count);
      } else {
        results = Math.round(cfg.insert_rows_count / total_time);
        process.stdout.write(JSON.stringify(results));
      }

      res.freeSync();
      conn.closeSync();
    });
  }, false);
});

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
        conn.query(cfg.insert_query)
            .on('result', function(r) {
              r.on('error', function(err) {
                console.error(err);
              })
              .on('end', insertAsync);
            })
            .on('error', function(err) {
              console.error(err);
            });
      } else {
        total_time = (Date.now() - start_time) / 1000;

        results = Math.round(cfg.insert_rows_count / total_time);

        conn.end();

        process.stdout.write(JSON.stringify(results));
      }
    }

    insertAsync();
  });
});

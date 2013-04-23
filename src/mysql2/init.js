#!/usr/bin/env node
require('./_common')(function(env) {
  var start_time = Date.now();
  var conn = env.do_init(function() {
    var results = (Date.now() - start_time) / 1000;
    conn.end();
    process.stdout.write(JSON.stringify(results));
  });
});

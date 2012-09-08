/**
 * Copyright (C) 2012, Oleg Efimov and other contributors
 *
 * See license text in LICENSE file
 */

if (!module.parent) {
  // Require modules
  var Client = require('mariasql'),
      conn;

  function selectAsyncBenchmark(results, callback, cfg) {
    var
      start_time,
      total_time;
    
    start_time = Date.now();

    var rows = [];
    conn.query(cfg.select_query)
        .on('error', function(err) {
          console.error(err);
          process.exit();
        })
        .on('result', function(result) {
          rows.push(result);
        })
        .on('end', function() {
          total_time = (Date.now() - start_time) / 1000;

          results['selects'] = Math.round(cfg.insert_rows_count / total_time);

          // Close connection
          conn.end();

          // Finish benchmark
          callback(results);
        });
  }

  function insertAsyncBenchmark(results, callback, cfg) {
    var
      start_time,
      total_time,
      i = 0;
    
    start_time = Date.now();
    
    function insertAsync() {
      i += 1;
      if (i <= cfg.insert_rows_count) {
        conn.query(cfg.insert_query)
            .on('error', function(err) {
              console.error(err);
              process.exit();
            })
            .on('end', insertAsync);
      } else {
        total_time = (Date.now() - start_time) / 1000;
        
        results['inserts'] = Math.round(cfg.insert_rows_count / total_time);
        
        setTimeout(function () {
          selectAsyncBenchmark(results, callback, cfg);
        }, cfg.delay_before_select);
      }
    }
    
    insertAsync();
  }

  function escapeBenchmark(results, callback, cfg) {
    var
      start_time,
      total_time,
      i = 0,
      escaped_string;
    
    start_time = Date.now();
    
    for (i = 0; i < cfg.escape_count; i += 1) {
      escaped_string = conn.escape(cfg.string_to_escape);
    }
    
    total_time = (Date.now() - start_time) / 1000;
    
    results['escapes'] = Math.round(cfg.escape_count / total_time);
    
    insertAsyncBenchmark(results, callback, cfg);
  }

  function startBenchmark(results, callback, cfg) {
    var
      start_time,
      total_time;
    
    start_time = Date.now();

    conn = new Client();
    conn.connect({
      host: cfg.host,
      port: cfg.port,
      user: cfg.user,
      password: cfg.password,
      db: cfg.database
    });

    
    conn.query("DROP TABLE IF EXISTS " + cfg.test_table)
        .on('error', function(err) {
          console.error(err);
          process.exit();
        });
    conn.query(cfg.create_table_query)
        .on('error', function(err) {
          console.error(err);
          process.exit();
        })
        .on('end', function() {
          total_time = (Date.now() - start_time) / 1000;
          results['init'] = total_time;
          escapeBenchmark(results, callback, cfg);
        });
  }

  var cfg = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', function(data) {
    cfg += data;
  });
  process.stdin.on('end', function() {
    var results = {},
        callback = function() {
          process.stdout.write(JSON.stringify(results));
        };
    startBenchmark(results, callback, JSON.parse(cfg));
  });
  process.stdin.resume();
}

exports.run = function (callback, cfg) {
  setTimeout(function() {
    process.stdout.write('Starting... ');
    var proc = require('child_process').spawn('node', [__filename]),
        exitEvent = (process.versions.node >= '0.8.0' ? 'close' : 'exit'),
        inspect = require('util').inspect,
        out = '';
    proc.stdout.setEncoding('ascii');
    proc.stdout.on('data', function(data) {
      out += data;
    });
    proc.stderr.setEncoding('utf8');
    proc.stderr.on('data', function(data) {
      console.error('stderr: ' + inspect(data));
    });
    proc.on(exitEvent, function() {
      callback(JSON.parse(out));
    });
    proc.stdin.end(JSON.stringify(cfg));
  }, cfg.cooldown);
};

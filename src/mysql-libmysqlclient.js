/**
 * Copyright (C) 2012, Oleg Efimov and other contributors
 *
 * See license text in LICENSE file
 */
if (!module.parent) {
  // Require modules
  var
    mysql = require('mysql-libmysqlclient'),
    conn;

  function fetchAllAsyncBenchmark(results, callback, cfg) {
    var
      start_time,
      total_time,
      factor = cfg.do_not_run_sync_if_async_exists ? 1 : 2,
      res,
      rows;
    
    start_time = Date.now();
    
    res = conn.querySync(cfg.select_query);
    
    res.fetchAll(function (err, rows) {
      if (err) {
        console.error(err);
        process.exit();
      }
      
      total_time = (Date.now() - start_time) / 1000;
      
      results['selects'] = Math.round(cfg.insert_rows_count / total_time);
      
      // Close connection
      conn.closeSync();
      
      // Finish benchmark
      callback(results);
    });
  }

  function fetchRowLoopSyncBenchmark(results, callback, cfg) {
    var
      start_time,
      total_time,
      factor = cfg.do_not_run_sync_if_async_exists ? 1 : 2,
      res,
      row,
      rows = [];

    start_time = Date.now();

    res = conn.querySync("SELECT * FROM " + cfg.test_table + ";");
    if (!res) {
      console.error("Query error " + conn.errnoSync() + ": " + conn.errorSync());
    }

    row = res.fetchRowSync();

    while (row) {
      rows.push(row);

      row = res.fetchRowSync();
    }

    res.freeSync();

    total_time = (Date.now() - start_time) / 1000;

    results['selectsWAT'] = Math.round(cfg.insert_rows_count / total_time);

    fetchAllAsyncBenchmark(results, callback, cfg);
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
        conn.query(cfg.insert_query, function (err) {
          if (err) {
            console.error(err);
            process.exit();
          }
          
          insertAsync();
        });
      } else {
        total_time = (Date.now() - start_time) / 1000;
        
        results['inserts'] = Math.round(cfg.insert_rows_count / total_time);
        
        setTimeout(function () {
          fetchRowLoopSyncBenchmark(results, callback, cfg);
        }, cfg.delay_before_select);
      }
    }
    
    insertAsync();
  }

  function insertSyncBenchmark(results, callback, cfg) {
    var
      start_time,
      total_time,
      i = 0,
      res;
    
    start_time = Date.now();
    
    for (i = 0; i < cfg.insert_rows_count; i += 1) {
      if (!conn.querySync(cfg.insert_query)) {
        console.error("Query error " + conn.errnoSync() + ": " + conn.errorSync());
        process.exit();
      }
    }
    
    total_time = (Date.now() - start_time) / 1000;
    
    results['insertsSync'] = Math.round(cfg.insert_rows_count / total_time);
    
    insertAsyncBenchmark(results, callback, cfg);
  }

  function reconnectSyncBenchmark(results, callback, cfg) {
    var
      start_time,
      total_time,
      i = 0;

    start_time = Date.now();
    
    for (i = 0; i < cfg.reconnect_count; i += 1) {
      conn.closeSync();
      if (!conn.connectSync(cfg.host, cfg.user, cfg.password, cfg.database, cfg.port)) {
        console.error("Connect error " + conn.connectErrno + ": " + conn.connectError);
        process.exit();
      }
    }
    
    total_time = (Date.now() - start_time) / 1000;
    
    results['reconnects'] = Math.round(cfg.reconnect_count / total_time);
    
    insertSyncBenchmark(results, callback, cfg);
  }

  function escapeBenchmark(results, callback, cfg) {
    var
      start_time,
      total_time,
      i = 0,
      escaped_string;

    start_time = Date.now();
    
    for (i = 0; i < cfg.escape_count; i += 1) {
      escaped_string = conn.escapeSync(cfg.string_to_escape);
    }
    
    total_time = (Date.now() - start_time) / 1000;
    
    results['escapes'] = Math.round(cfg.escape_count / total_time);
    
    reconnectSyncBenchmark(results, callback, cfg);
  }

  function startBenchmark(results, callback, cfg) {
    var
      start_time,
      total_time;
    
    start_time = Date.now();
    
    conn = mysql.createConnectionSync();
    if (!conn.connectSync(cfg.host, cfg.user, cfg.password, cfg.database, cfg.port)) {
      console.error("Connect error " + conn.connectErrno + ": " + conn.connectError);
      process.exit();
    }
    
    if (!conn.querySync("DROP TABLE IF EXISTS " + cfg.test_table)) {
      console.error("Query error " + conn.errnoSync() + ": " + conn.errorSync());
      process.exit();
    }

    if (!conn.querySync(cfg.create_table_query)) {
      console.error("Query error " + conn.errnoSync() + ": " + conn.errorSync());
      process.exit();
    }
    
    total_time = (Date.now() - start_time) / 1000;
    
    results['init'] = total_time;
    
    escapeBenchmark(results, callback, cfg);
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
};

/**
 * Copyright (C) 2012, Oleg Efimov and other contributors
 *
 * See license text in LICENSE file
 */

"use strict";

function benchmark() {
  // Require modules
  var
    mysql = require('mysql-libmysqlclient'),
    helper = require('./helper'),
    conn;

  function selectAsyncBenchmark(results, callback, cfg, benchmark) {
    var
      start_hrtime,
      res;
    
    start_hrtime = process.hrtime();
    
    res = conn.querySync(cfg.select_query);
    
    res.fetchAll(function (err, rows) {
      if (err) {
        console.error(err);
        process.exit();
      }
      
      results.selects = Math.round(cfg.insert_rows_count / helper.hrtimeDeltaInSeconds(start_hrtime));

      // Close connection
      conn.closeSync();
      
      // Finish benchmark
      callback(results);
    });
  }

  function insertAsyncBenchmark(results, callback, cfg, benchmark) {
    var
      start_hrtime,
      i = 0;
    
    start_hrtime = process.hrtime();
    
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
        results.inserts = Math.round(cfg.insert_rows_count / helper.hrtimeDeltaInSeconds(start_hrtime));
        
        setTimeout(function () {
          selectAsyncBenchmark(results, callback, cfg, benchmark);
        }, cfg.delay_before_select);
      }
    }
    
    insertAsync();
  }

  function selectSyncBenchmark(results, callback, cfg, benchmark) {
    var
      start_hrtime,
      res;

    start_hrtime = process.hrtime();

    res = conn.querySync(cfg.select_query);

    var rows = res.fetchAllSync();

    results.selects = Math.round(cfg.insert_rows_count / helper.hrtimeDeltaInSeconds(start_hrtime));

    // Close connection
    conn.closeSync();

    // Finish benchmark
    callback(results);
  }

  function insertSyncBenchmark(results, callback, cfg, benchmark) {
    var
      start_hrtime,
      i;
    
    start_hrtime = process.hrtime();
    
    for (i = 0; i < cfg.insert_rows_count; i += 1) {
      if (!conn.querySync(cfg.insert_query)) {
        console.error("Query error " + conn.errnoSync() + ": " + conn.errorSync());
        process.exit();
      }
    }

    results.inserts = Math.round(cfg.insert_rows_count / helper.hrtimeDeltaInSeconds(start_hrtime));

    selectSyncBenchmark(results, callback, cfg, benchmark);
  }

  function reconnectBenchmark(results, callback, cfg, benchmark) {
    var
      start_hrtime,
      i;

    start_hrtime = process.hrtime();
    
    for (i = 0; i < cfg.reconnect_count; i += 1) {
      conn.closeSync();
      if (!conn.connectSync(cfg.host, cfg.user, cfg.password, cfg.database, cfg.port)) {
        console.error("Connect error " + conn.connectErrno + ": " + conn.connectError);
        process.exit();
      }
    }

    results.reconnects = Math.round(cfg.reconnect_count / helper.hrtimeDeltaInSeconds(start_hrtime));

    if (benchmark.async) {
      insertAsyncBenchmark(results, callback, cfg, benchmark);
    } else {
      insertSyncBenchmark(results, callback, cfg, benchmark);
    }
  }

  function escapeBenchmark(results, callback, cfg, benchmark) {
    var
      start_hrtime,
      i,
      escaped_string;

    start_hrtime = process.hrtime();
    
    for (i = 0; i < cfg.escapes_count; i += 1) {
      escaped_string = conn.escapeSync(cfg.string_to_escape);
    }
    
    results.escapes = Math.round(cfg.escapes_count / helper.hrtimeDeltaInSeconds(start_hrtime));
    
    reconnectBenchmark(results, callback, cfg, benchmark);
  }

  function initBenchmark(results, callback, cfg, benchmark) {
    var start_hrtime;
    
    start_hrtime = process.hrtime();
    
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

    results.init = helper.roundWithPrecision(helper.hrtimeDeltaInSeconds(start_hrtime), 3);
    
    escapeBenchmark(results, callback, cfg, benchmark);
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

    cfg = JSON.parse(cfg);
    initBenchmark(results, callback, cfg, cfg.benchmark);
  });
  process.stdin.resume();
}

if (!module.parent) {
  benchmark();
}

exports.run = function (callback, cfg, benchmark) {
  require('./helper').spawnBenchmark('node', [__filename], callback, cfg, benchmark);
};

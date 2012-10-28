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
    conn;

  function selectAsyncBenchmark(results, callback, cfg, benchmark) {
    var
      start_time,
      total_time,
      res;
    
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

  function insertAsyncBenchmark(results, callback, cfg, benchmark) {
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
        
        results.inserts = Math.round(cfg.insert_rows_count / total_time);
        
        setTimeout(function () {
          selectAsyncBenchmark(results, callback, cfg, benchmark);
        }, cfg.delay_before_select);
      }
    }
    
    insertAsync();
  }

  function selectSyncBenchmark(results, callback, cfg, benchmark) {
    var
      start_time,
      total_time,
      res;

    start_time = Date.now();

    res = conn.querySync(cfg.select_query);

    var rows = res.fetchAllSync();

    total_time = (Date.now() - start_time) / 1000;

    results.selects = Math.round(cfg.insert_rows_count / total_time);

    // Close connection
    conn.closeSync();

    // Finish benchmark
    callback(results);
  }

  function insertSyncBenchmark(results, callback, cfg, benchmark) {
    var
      start_time,
      total_time,
      i;
    
    start_time = Date.now();
    
    for (i = 0; i < cfg.insert_rows_count; i += 1) {
      if (!conn.querySync(cfg.insert_query)) {
        console.error("Query error " + conn.errnoSync() + ": " + conn.errorSync());
        process.exit();
      }
    }
    
    total_time = (Date.now() - start_time) / 1000;
    
    results.inserts = Math.round(cfg.insert_rows_count / total_time);

    selectSyncBenchmark(results, callback, cfg, benchmark);
  }

  function reconnectBenchmark(results, callback, cfg, benchmark) {
    var
      start_time,
      total_time,
      i;

    start_time = Date.now();
    
    for (i = 0; i < cfg.reconnect_count; i += 1) {
      conn.closeSync();
      if (!conn.connectSync(cfg.host, cfg.user, cfg.password, cfg.database, cfg.port)) {
        console.error("Connect error " + conn.connectErrno + ": " + conn.connectError);
        process.exit();
      }
    }
    
    total_time = (Date.now() - start_time) / 1000;
    
    results.reconnects = Math.round(cfg.reconnect_count / total_time);

    if (benchmark.async) {
      insertAsyncBenchmark(results, callback, cfg, benchmark);
    } else {
      insertSyncBenchmark(results, callback, cfg, benchmark);
    }
  }

  function escapeBenchmark(results, callback, cfg, benchmark) {
    var
      start_time,
      total_time,
      i,
      escaped_string;

    start_time = Date.now();
    
    for (i = 0; i < cfg.escapes_count; i += 1) {
      escaped_string = conn.escapeSync(cfg.string_to_escape);
    }
    
    total_time = (Date.now() - start_time) / 1000;
    
    results.escapes = Math.round(cfg.escapes_count / total_time);
    
    reconnectBenchmark(results, callback, cfg, benchmark);
  }

  function initBenchmark(results, callback, cfg, benchmark) {
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
    
    results.init = total_time;
    
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

/**
 * Copyright (C) 2012, Oleg Efimov and other contributors
 *
 * See license text in LICENSE file
 */

// Require modules
var
  util = require('util'),
  mysql = require('mysql-libmysqlclient'),
  conn;

function fetchAllAsyncBenchmark(results, callback, cfg) {
  var
    start_time,
    total_time,
    factor = cfg.do_not_run_sync_if_async_exists ? 1 : 2,
    res,
    rows;
  
  start_time = new Date();
  
  res = conn.querySync("SELECT * FROM " + cfg.test_table + ";");
  
  res.fetchAll(function (err, rows) {
    if (err) {
      console.log(err);
    }
    
    total_time = ((new Date()) - start_time) / 1000;
    
    results['selects'] = Math.round(cfg.insert_rows_count / total_time);
    
    // Close connection
    conn.closeSync();
    
    // Finish benchmark
    callback(results);
  });
}

function fetchObjectLoopSyncBenchmark(results, callback, cfg) {
  var
    start_time,
    total_time,
    factor = cfg.do_not_run_sync_if_async_exists ? 1 : 2,
    res,
    row,
    rows = [];
  
  start_time = new Date();
  
  res = conn.querySync("SELECT * FROM " + cfg.test_table + ";");
  
  row = res.fetchObjectSync();
  
  while (row) {
    rows.push(row);
    
    row = res.fetchObjectSync();
  }
  
  res.freeSync();
  
  total_time = ((new Date()) - start_time) / 1000;
  
  results['selectsWAT'] = Math.round(cfg.insert_rows_count / total_time);
  
  fetchAllAsyncBenchmark(results, callback, cfg);
}

function insertAsyncBenchmark(results, callback, cfg) {
  var
    start_time,
    total_time,
    i = 0;
  
  start_time = new Date();
  
  function insertAsync() {
    i += 1;
    if (i <= cfg.insert_rows_count) {
      conn.query(cfg.insert_query, function (err) {
        if (err) {
          console.log(err);
        }
        
        insertAsync();
      });
    } else {
      total_time = ((new Date()) - start_time) / 1000;
      
      results['inserts'] = Math.round(cfg.insert_rows_count / total_time);
      
      setTimeout(function () {
        fetchObjectLoopSyncBenchmark(results, callback, cfg);
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
  
  start_time = new Date();
  
  for (i = 0; i < cfg.insert_rows_count; i += 1) {
    res = conn.querySync(cfg.insert_query);
  }
  
  total_time = ((new Date()) - start_time) / 1000;
  
  results['insertsSync'] = Math.round(cfg.insert_rows_count / total_time);
  
  insertAsyncBenchmark(results, callback, cfg);
}

function reconnectSyncBenchmark(results, callback, cfg) {
  var
    start_time,
    total_time,
    i = 0;

  start_time = new Date();
  
  for (i = 0; i < cfg.reconnect_count; i += 1) {
    conn.closeSync();
    conn.connectSync(cfg.host, cfg.user, cfg.password, cfg.database, cfg.port);
  }
  
  total_time = ((new Date()) - start_time) / 1000;
  
  results['reconnects'] = Math.round(cfg.reconnect_count / total_time);
  
  insertSyncBenchmark(results, callback, cfg);
}

function escapeBenchmark(results, callback, cfg) {
  var
    start_time,
    total_time,
    i = 0,
    escaped_string;

  start_time = new Date();
  
  for (i = 0; i < cfg.escape_count; i += 1) {
    escaped_string = conn.escapeSync(cfg.string_to_escape);
  }
  
  total_time = ((new Date()) - start_time) / 1000;
  
  results['escapes'] = Math.round(cfg.escape_count / total_time);
  
  reconnectSyncBenchmark(results, callback, cfg);
}

function startBenchmark(results, callback, cfg) {
  var
    start_time,
    total_time;
  
  start_time = new Date();
  
  conn = mysql.createConnectionSync();
  conn.connectSync(cfg.host, cfg.user, cfg.password, cfg.database, cfg.port);
  
  conn.querySync("DROP TABLE IF EXISTS " + cfg.test_table + ";");
  conn.querySync(cfg.create_table_query);
  
  total_time = ((new Date()) - start_time) / 1000;
  
  results['init'] = total_time;
  
  escapeBenchmark(results, callback, cfg);
}

exports.run = function (callback, cfg) {
  var results = {};
  
  startBenchmark(results, callback, cfg);
};


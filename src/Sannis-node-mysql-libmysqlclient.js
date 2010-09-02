/*
Copyright (C) 2010, Oleg Efimov <efimovov@gmail.com>

See license text in LICENSE file
*/

// Require modules
var
  assert = require("assert"),
  sys = require("sys"),
  mysql = require("../deps/Sannis-node-mysql-libmysqlclient/mysql-libmysqlclient"),
  conn = mysql.createConnectionSync(),
  global_start_time,
  global_total_time;

function selectSyncBenchmark(callback, cfg) {
  var
    start_time,
    total_time,
    factor = cfg.do_not_run_sync_if_async_exists ? 1 : 2,
    res,
    rows;

  start_time = new Date();
  
  res = conn.querySync("SELECT * FROM " + cfg.test_table + ";");
  rows = res.fetchAllSync();
  
  total_time = ((new Date()) - start_time) / 1000;
  sys.puts("**** " + (factor * cfg.insert_rows_count) + " rows sync selected in " + total_time + "s (" + Math.round(factor * cfg.insert_rows_count / total_time) + "/s)");
  
  // Some tests
  if (rows.length !== factor * cfg.insert_rows_count) {
    sys.puts("\033[31m**** " + (factor * cfg.insert_rows_count) + " rows inserted" +
             ", but only " + rows.length + " rows selected\033[39m");
  }
  assert.deepEqual(rows[0], cfg.selected_row_example);
  
  // Finish benchmark
  global_total_time = ((new Date()) - global_start_time - cfg.delay_before_select) / 1000;
  sys.puts("** Total time is " + global_total_time + "s");
  
  conn.closeSync();
  
  callback.apply();
}

function insertAsyncBenchmark(callback, cfg) {
  var
    start_time,
    total_time,
    i = 0;
  
  start_time = new Date();
  
  function insertAsync() {
    i += 1;
    if (i <= cfg.insert_rows_count) {
      conn.query(cfg.insert_query, function (res) {
        insertAsync();
      });
    } else {
      total_time = ((new Date()) - start_time) / 1000;
      sys.puts("**** " + cfg.insert_rows_count + " async insertions in " + total_time + "s (" + Math.round(cfg.insert_rows_count / total_time) + "/s)");
      
      setTimeout(function () {
        selectSyncBenchmark(callback, cfg);
      }, cfg.delay_before_select);
    }
  }
  
  insertAsync();
}

function insertSyncBenchmark(callback, cfg) {
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
  sys.puts("**** " + cfg.insert_rows_count + " sync insertions in " + total_time + "s (" + Math.round(cfg.insert_rows_count / total_time) + "/s)");
  
  insertAsyncBenchmark(callback, cfg);
}

function reconnectSyncBenchmark(callback, cfg) {
  var
    start_time,
    total_time,
    i = 0;

  start_time = new Date();
  
  for (i = 0; i < cfg.reconnect_count; i += 1) {
    conn.closeSync();
    conn.connectSync(cfg.host, cfg.user, cfg.password, cfg.database);
  }
  
  total_time = ((new Date()) - start_time) / 1000;
  sys.puts("**** " + cfg.reconnect_count + " sync reconnects in " + total_time + "s (" + Math.round(cfg.reconnect_count / total_time) + "/s)");
  
  if (cfg.do_not_run_sync_if_async_exists) {
    insertAsyncBenchmark(callback, cfg);
  } else {
    insertSyncBenchmark(callback, cfg);
  }
}

function escapeBenchmark(callback, cfg) {
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
  sys.puts("**** " + cfg.escape_count + " escapes in " + total_time + "s (" + Math.round(cfg.escape_count / total_time) + "/s)");
  
  reconnectSyncBenchmark(callback, cfg);
}

function startBenchmark(callback, cfg) {
  var
    start_time,
    total_time,
    res;
  
  start_time = new Date();
  
  conn.connectSync(cfg.host, cfg.user, cfg.password, cfg.database);
  
  if (!conn.connectedSync()) {
    sys.puts("\033[31m** Connection error: " + conn.connectErrnoSync() + ", " + conn.connectErrorSync() + "\033[39m");
    
    // Finish benchmark
    global_total_time = ((new Date()) - global_start_time - cfg.delay_before_select) / 1000;
    sys.puts("\033[31m** Total time is " + global_total_time + "s\033[39m");
  
    callback.apply();
    return;
  }

  res = conn.querySync("DROP TABLE IF EXISTS " + cfg.test_table + ";");
  res = conn.querySync("SET max_heap_table_size=128M;");
  res = conn.querySync(cfg.create_table_query);
  
  total_time = ((new Date()) - start_time) / 1000;
  sys.puts("**** Benchmark initialization time is " + total_time + "s");
  
  escapeBenchmark(callback, cfg);
}

exports.run = function (callback, cfg) {
  global_start_time = new Date();
  
  startBenchmark(callback, cfg);
};


/*
Copyright (C) 2010, Oleg Efimov <efimovov@gmail.com>

See license text in LICENSE file
*/

// Load configuration
var cfg = require("./config").cfg;

// Require modules
var
  assert = require("assert"),
  sys = require("sys"),
  mysql = require("../deps/Sannis-node-mysql-libmysqlclient/mysql-libmysqlclient"),
  conn = mysql.createConnection(),
  global_start_time,
  global_total_time;

function selectSyncBenchmark(callback) {
  var
    start_time,
    total_time,
    factor = cfg.do_not_run_sync_if_async_exists ? 1 : 2;

  start_time = new Date();
  
  var res = conn.query("SELECT * FROM " + cfg.test_table + ";");
  var rows = res.fetchAll();
  
  total_time = ((new Date()) - start_time) / 1000;
  sys.puts("**** " + (factor * cfg.insert_rows_count) + " rows sync selected in " + total_time + "s (" + Math.round(cfg.insert_rows_count / total_time) + "/s)");
  
  // Some tests
  if (rows.length !== factor * cfg.insert_rows_count) {
    sys.puts("\033[31m**** " + (factor * cfg.insert_rows_count) + " rows inserted" +
             ", but only " + rows.length + " rows selected\033[39m");
  }
  assert.deepEqual(rows[0], cfg.selected_row_example);
  
  // Finish benchmark
  global_total_time = ((new Date()) - global_start_time - cfg.delay_before_select) / 1000;
  sys.puts("** Total time is " + global_total_time + "s");
  
  conn.close();
  
  callback.apply();
}

function insertAsyncBenchmark(callback) {
  var
    start_time,
    total_time,
    i = 0;
  
  start_time = new Date();

  function insertAsync() {
    i += 1;
    if (i <= cfg.insert_rows_count) {
      conn.queryAsync(cfg.insert_query, function (res) {
        insertAsync();
      });
    } else {
      total_time = ((new Date()) - start_time) / 1000;
      sys.puts("**** " + cfg.insert_rows_count + " async insertions in " + total_time + "s (" + Math.round(cfg.insert_rows_count / total_time) + "/s)");
      
      setTimeout(function () {
        selectSyncBenchmark(callback);
      }, cfg.delay_before_select);
    }
  }

  insertAsync();
}

function insertSyncBenchmark(callback) {
  var
    start_time,
    total_time,
    i = 0,
    res;
  
  start_time = new Date();

  for (i = 0; i < cfg.insert_rows_count; i += 1) {
    res = conn.query(cfg.insert_query);
  }
  
  total_time = ((new Date()) - start_time) / 1000;
  sys.puts("**** " + cfg.insert_rows_count + " sync insertions in " + total_time + "s (" + Math.round(cfg.insert_rows_count / total_time) + "/s)");
  
  insertAsyncBenchmark(callback);
}

function reconnectSyncBenchmark(callback) {
  var
    start_time,
    total_time,
    i = 0;

  start_time = new Date();
  
  for (i = 0; i < cfg.reconnect_count; i += 1) {
    conn.close();
    conn.connect(cfg.host, cfg.user, cfg.password, cfg.database);
  }
  
  total_time = ((new Date()) - start_time) / 1000;
  sys.puts("**** " + cfg.reconnect_count + " sync reconnects in " + total_time + "s (" + Math.round(cfg.reconnect_count / total_time) + "/s)");
  
  if (cfg.do_not_run_sync_if_async_exists) {
    insertAsyncBenchmark(callback);
  } else {
    insertSyncBenchmark(callback);
  }
}

function escapeBenchmark(callback) {
  var
    start_time,
    total_time,
    i = 0,
    escaped_string;

  start_time = new Date();
  
  for (i = 0; i < cfg.escape_count; i += 1) {
    escaped_string = conn.escape(cfg.string_to_escape);
  }
  
  total_time = ((new Date()) - start_time) / 1000;
  sys.puts("**** " + cfg.escape_count + " escapes in " + total_time + "s (" + Math.round(cfg.escape_count / total_time) + "/s)");
  
  reconnectSyncBenchmark(callback);
}

function startBenchmark(callback) {
  var
    start_time,
    total_time,
    res;
  
  start_time = new Date();
  
  conn.connect(cfg.host, cfg.user, cfg.password, cfg.database);
  
  if (!conn.connected()) {
    sys.puts("\033[31m** Connection error: " + conn.connectErrno() + ", " + conn.connectError() + "\033[39m");
    
    // Finish benchmark
    global_total_time = ((new Date()) - global_start_time - cfg.delay_before_select) / 1000;
    sys.puts("\033[31m** Total time is " + global_total_time + "s\033[39m");
  
    callback.apply();
    return;
  }

  res = conn.query("DROP TABLE IF EXISTS " + cfg.test_table + ";");
  res = conn.query("SET max_heap_table_size=128M;");
  res = conn.query(cfg.create_table_query);
  
  total_time = ((new Date()) - start_time) / 1000;
  sys.puts("**** Benchmark initialization time is " + total_time + "s");
  
  escapeBenchmark(callback);
}

exports.run = function (callback) {
  global_start_time = new Date();
  
  startBenchmark(callback);
};


/*
Copyright (C) 2010, Oleg Efimov <efimovov@gmail.com>

See license text in LICENSE file
*/

// Require modules
var
  assert = require('assert'),
  sys = require('sys'),
  mysql_client = require('../deps/felixge-node-mysql/lib/mysql').Client,
  conn = new mysql_client(),
  rows,
  global_start_time,
  global_total_time;

function selectAsyncBenchmark(callback, cfg) {
  var
    start_time,
    total_time;

  start_time = new Date();
  
  conn.query("SELECT * FROM " + cfg.test_table + ";", function (err, results, fields) {
    total_time = ((new Date()) - start_time) / 1000;
    sys.puts("**** " + cfg.insert_rows_count + " rows async selected in " + total_time + "s (" + Math.round(cfg.insert_rows_count / total_time) + "/s)");

    // Some tests
    if (results.length !== cfg.insert_rows_count) {
      sys.puts("\033[31m**** " + cfg.insert_rows_count + " rows inserted" +
               ", but only " + results.length + " rows selected\033[39m");
    }
    assert.deepEqual(results[0], cfg.selected_row_example);
  
    // Finish benchmark
    global_total_time = ((new Date()) - global_start_time - cfg.delay_before_select) / 1000;
    sys.puts("** Total time is " + global_total_time + "s");
  
    conn.end();
    
    callback.apply()
  });
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
      conn.query(cfg.insert_query, function (err, result) {
        insertAsync();
      });
    } else {
      total_time = ((new Date()) - start_time) / 1000;
      sys.puts("**** " + cfg.insert_rows_count + " async insertions in " + total_time + "s (" + Math.round(cfg.insert_rows_count / total_time) + "/s)");
      
      setTimeout(function () {
        selectAsyncBenchmark(callback, cfg);
      }, cfg.delay_before_select);
    }
  }

  insertAsync();
}

function reconnectAsyncBenchmark(callback, cfg) {
  var
    start_time,
    total_time,
    i = 0;

  start_time = new Date();

  function reconnectAsync() {
    i += 1;
    if (i <= cfg.reconnect_count) {
      conn.end();
      conn.connect(function (err, result) {
        reconnectAsync();
      });
    } else {
      total_time = ((new Date()) - start_time) / 1000;
      sys.puts("**** " + cfg.reconnect_count + " async reconnects in " + total_time + "s (" + Math.round(cfg.reconnect_count / total_time) + "/s)");
      
      insertAsyncBenchmark(callback, cfg);
    }
  }
  
  reconnectAsync();
}

function escapeBenchmark(callback, cfg) {
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
  
  reconnectAsyncBenchmark(callback, cfg);
}

function startBenchmark(callback, cfg) {
  var
    start_time,
    total_time;
  
  start_time = new Date();
  
  conn.host     = cfg.host;
  conn.user     = cfg.user;
  conn.password = cfg.password;
  conn.database = cfg.database;

  conn.connect(function (err, result) {
    conn.query("DROP TABLE IF EXISTS " + cfg.test_table + ";", function () {
      conn.query(cfg.create_table_query, function () {
        total_time = ((new Date()) - start_time) / 1000;
        sys.puts("**** Benchmark initialization time is " + total_time + "s");
        
        escapeBenchmark(callback, cfg);
      });
    });
  });
}

exports.run = function (callback, cfg) {
  global_start_time = new Date();
  
  startBenchmark(callback, cfg);
};


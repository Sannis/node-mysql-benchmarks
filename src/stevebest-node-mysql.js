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
  mysql = require("../deps/stevebest-node-mysql/lib/mysql"),
  conn = new mysql.Connection(cfg.host, cfg.user, cfg.password, cfg.database),
  global_start_time,
  global_total_time;

function selectAsyncBenchmark(callback) {
  var
    start_time,
    total_time;

  start_time = new Date();
  
  conn.query("SELECT * FROM " + cfg.test_table + ";", function (results, fields) {
    total_time = ((new Date()) - start_time) / 1000;
    sys.puts("**** " + cfg.insert_rows_count + " rows async selected in " + total_time + "s (" + Math.round(cfg.insert_rows_count / total_time) + "/s)");
  
    // Some tests
    if (results.records.length !== cfg.insert_rows_count) {
      sys.puts("\033[31m**** " + cfg.insert_rows_count + " rows inserted" +
               ", but only " + results.length + " rows selected\033[39m");
    }
    var result_object = {};
    for (var j in results.fields) {
      result_object[results.fields[j].name] = results.records[0][j];
    }
    assert.deepEqual(result_object, cfg.selected_row_example);
  
    // Finish benchmark
    global_total_time = ((new Date()) - global_start_time - cfg.delay_before_select) / 1000;
    sys.puts("** Total time is " + global_total_time + "s");
  
    conn.close();
    
    callback.apply()
  });;
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
      conn.query(cfg.insert_query, function (err, result) {
        insertAsync();
      });
    } else {
      total_time = ((new Date()) - start_time) / 1000;
      sys.puts("**** " + cfg.insert_rows_count + " async insertions in " + total_time + "s (" + Math.round(cfg.insert_rows_count / total_time) + "/s)");

      setTimeout(function () {
        selectAsyncBenchmark(callback);
      }, cfg.delay_before_select);
    }
  }

  insertAsync();
}

function reconnectAsyncBenchmark(callback) {
  var
    start_time,
    total_time,
    i = 0;

  start_time = new Date();

  function reconnectAsync() {
    i += 1;
    if (i <= cfg.reconnect_count) {
      conn.close();
      conn.connect(function () {
        reconnectAsync();
      });
    } else {
      total_time = ((new Date()) - start_time) / 1000;
      sys.puts("**** " + cfg.reconnect_count + " async reconnects in " + total_time + "s (" + Math.round(cfg.reconnect_count / total_time) + "/s)");

      insertAsyncBenchmark(callback);
    }
  }
  
  reconnectAsync();
}

function escapeBenchmark(callback) {
  var
    start_time,
    total_time,
    i = 0,
    escaped_string;

  start_time = new Date();

  for (i = 0; i < cfg.escape_count; i += 1) {
    escaped_string = mysql.quote(cfg.string_to_escape);
  }

  total_time = ((new Date()) - start_time) / 1000;
  sys.puts("**** " + cfg.escape_count + " escapes in " + total_time + "s (" + Math.round(cfg.escape_count / total_time) + "/s)");
  
  reconnectAsyncBenchmark(callback);
}

function startBenchmark(callback) {
  var
    start_time,
    total_time;
  
  start_time = new Date();

  conn.connect(function () {
    conn.query("DROP TABLE IF EXISTS " + cfg.test_table + ";", function () {
      //conn.query("SET max_heap_table_size=128M;", function () { // Not supported?
        conn.query(cfg.create_table_query, function () {
          total_time = ((new Date()) - start_time) / 1000;
          sys.puts("**** Benchmark initialization time is " + total_time + "s");

          escapeBenchmark(callback);
        });
      //});
    });
  });
}

exports.run = function (callback) {
  global_start_time = new Date();
  
  startBenchmark(callback);
};


/*
Copyright (C) 2010, Oleg Efimov <efimovov@gmail.com>

See license text in LICENSE file
*/

// Require modules
var
  assert = require('assert'),
  sys = require('sys'),
  mysql = require('../deps/sidorares-nodejs-mysql-native/lib/mysql-native'),
  conn,
  global_start_time,
  global_total_time;

function selectAsyncBenchmark(callback, cfg) {
  var
    start_time,
    total_time,
    rows = [],
    selected_row_example_array = [];
  
  start_time = new Date();
  
  conn.query("SELECT * FROM " + cfg.test_table + ";").on('row', function (row) {
    rows.push(row);
  }).on('end', function () {
    total_time = ((new Date()) - start_time) / 1000;
    sys.puts("**** " + cfg.insert_rows_count + " rows async selected in " + total_time + "s (" + Math.round(cfg.insert_rows_count / total_time) + "/s)");
    
    // Some tests
    if (rows.length !== cfg.insert_rows_count) {
      sys.puts("\033[31m**** " + cfg.insert_rows_count + " rows inserted" +
               ", but only " + rows.length + " rows selected\033[39m");
    }
    for (var key in cfg.selected_row_example) {
      selected_row_example_array.push(cfg.selected_row_example[key]);
    }
    assert.deepEqual(rows[0], selected_row_example_array);
    
    // Finish benchmark
    global_total_time = ((new Date()) - global_start_time - cfg.delay_before_select) / 1000;
    sys.puts("** Total time is " + global_total_time + "s");
    
    conn.close();
    
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
      conn.query(cfg.insert_query).on('end', function () {
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
      conn.close().on('end', function () {
      sys.debug("Close " + i);
        conn.auth(cfg.database, cfg.user, cfg.password).on('end', function(s) {
        sys.debug("Auth " + i);
          reconnectAsync();
        });
      });

    } else {
      total_time = ((new Date()) - start_time) / 1000;
      sys.puts("**** " + cfg.reconnect_count + " async reconnects in " + total_time + "s (" + Math.round(cfg.reconnect_count / total_time) + "/s)");
      
      insertSyncBenchmark(callback, cfg);
    }
  }
  
  reconnectAsync();
}

function startBenchmark(callback, cfg) {
  var
    start_time,
    total_time;
  
  conn = mysql.createTCPClient(cfg.host);
  
  start_time = new Date();
  
  conn.auth(cfg.database, cfg.user, cfg.password).on('end', function(s) {
    conn.query("DROP TABLE IF EXISTS " + cfg.test_table + ";").on('end', function() {
      conn.query(cfg.create_table_query).on('end', function() {
        total_time = ((new Date()) - start_time) / 1000;
        sys.puts("**** Benchmark initialization time is " + total_time + "s");
        
        //reconnectAsyncBenchmark(callback, cfg);
        insertAsyncBenchmark(callback, cfg);
      });
    });
  });
}

exports.run = function (callback, cfg) {
  global_start_time = new Date();
  
  startBenchmark(callback, cfg);
};


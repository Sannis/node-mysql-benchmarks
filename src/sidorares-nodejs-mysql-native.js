/*
Copyright (C) 2010, Oleg Efimov <efimovov@gmail.com>

See license text in LICENSE file
*/

// Require modules
var
  util = require('util'),
  mysql = require('mysql-native'),
  conn;

function selectAsyncBenchmark(callback, cfg) {
  var
    start_time,
    total_time,
    rows = [];
  
  start_time = new Date();
  
  conn.query("SELECT * FROM " + cfg.test_table + ";").on('row', function (row) {
    rows.push(row);
  }).on('end', function () {
    total_time = ((new Date()) - start_time) / 1000;
    util.puts("**** " + cfg.insert_rows_count
                      + " rows async selected in "
                      + total_time + "s ("
                      + Math.round(cfg.insert_rows_count / total_time)
                      + "/s)");
    
    // Finish benchmark
    conn.close();
    callback.apply();
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
      util.puts("**** " + cfg.insert_rows_count
                        + " async insertions in "
                        + total_time + "s ("
                        + Math.round(cfg.insert_rows_count / total_time)
                        + "/s)");
      
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
        util.debug("Close " + i);
        conn.auth(cfg.database, cfg.user, cfg.password).on('end', function (s) {
          util.debug("Auth " + i);
          reconnectAsync();
        });
      });

    } else {
      total_time = ((new Date()) - start_time) / 1000;
      util.puts("**** " + cfg.reconnect_count
                        + " async reconnects in "
                        + total_time + "s ("
                        + Math.round(cfg.reconnect_count / total_time)
                        + "/s)");
      
      insertAsyncBenchmark(callback, cfg);
    }
  }
  
  reconnectAsync();
}

function startBenchmark(callback, cfg) {
  var
    start_time,
    total_time;
  
  start_time = new Date();
  
  conn = mysql.createTCPClient(cfg.host);
  
  conn.auth(cfg.database, cfg.user, cfg.password).on('end', function (s) {
    conn.query("DROP TABLE IF EXISTS " + cfg.test_table + ";").on('end', function () {
      conn.query(cfg.create_table_query).on('end', function () {
        total_time = ((new Date()) - start_time) / 1000;
        util.puts("**** Benchmark initialization time is " + total_time + "s");
        
        //reconnectAsyncBenchmark(callback, cfg);
        insertAsyncBenchmark(callback, cfg);
      });
    });
  });
}

exports.run = function (callback, cfg) {
  startBenchmark(callback, cfg);
};


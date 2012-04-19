/*
Copyright (C) 2010, Oleg Efimov <efimovov@gmail.com>

See license text in LICENSE file
*/

// Require modules
var
  util = require('util'),
  mysql = require('mysql-native'),
  conn;

function selectAsyncBenchmark(results, callback, cfg) {
  var
    start_time,
    total_time,
    rows = [];
  
  start_time = new Date();
  
  conn.query("SELECT * FROM " + cfg.test_table + ";").on('row', function (row) {
    rows.push(row);
  }).on('end', function () {
    total_time = ((new Date()) - start_time) / 1000;
    
    results['selects'] = Math.round(cfg.insert_rows_count / total_time);
    
    // Close connection
    conn.close();
    
    // Finish benchmark
    callback(results);
  });
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
      conn.query(cfg.insert_query).on('end', function () {
        insertAsync();
      });
    } else {
      total_time = ((new Date()) - start_time) / 1000;
      
      results['inserts'] = Math.round(cfg.insert_rows_count / total_time);
      
      setTimeout(function () {
        selectAsyncBenchmark(results, callback, cfg);
      }, cfg.delay_before_select);
    }
  }
  
  insertAsync();
}

function reconnectAsyncBenchmark(results, callback, cfg) {
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
      
      results['reconnects'] = Math.round(cfg.reconnect_count / total_time);
      
      insertAsyncBenchmark(results, callback, cfg);
    }
  }
  
  reconnectAsync();
}

function startBenchmark(results, callback, cfg) {
  var
    start_time,
    total_time;
  
  start_time = new Date();
  
  conn = mysql.createTCPClient(cfg.host);
  
  conn.auth(cfg.database, cfg.user, cfg.password).on('end', function (s) {
    conn.query("DROP TABLE IF EXISTS " + cfg.test_table + ";").on('end', function () {
      conn.query(cfg.create_table_query).on('end', function () {
        total_time = ((new Date()) - start_time) / 1000;
        
        results['init'] = total_time;
        
        //reconnectAsyncBenchmark(results, callback, cfg);
        insertAsyncBenchmark(results, callback, cfg);
      });
    });
  });
}

exports.run = function (callback, cfg) {
  var results = {};
  
  startBenchmark(results, callback, cfg);
};


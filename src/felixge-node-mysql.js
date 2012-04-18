/*
Copyright (C) 2010, Oleg Efimov <efimovov@gmail.com>

See license text in LICENSE file
*/

// Require modules
var
  util = require('util'),
  Mysql = require('mysql').Client,
  conn,
  rows;

function selectAsyncBenchmark(results, callback, cfg) {
  var
    start_time,
    total_time;
  
  start_time = new Date();
  
  conn.query("SELECT * FROM " + cfg.test_table + ";", function (err) {
    if (err) {
      console.log(err);
    }
    
    total_time = ((new Date()) - start_time) / 1000;
    
    results['selects'] = Math.round(cfg.insert_rows_count / total_time)
    
    // Close connection
    conn.end();
    
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
      conn.query(cfg.insert_query, function (err) {
        if (err) {
          console.log(err);
        }
        
        insertAsync();
      });
    } else {
      total_time = ((new Date()) - start_time) / 1000;
      
      results['inserts'] = Math.round(cfg.insert_rows_count / total_time)
      
      setTimeout(function () {
        selectAsyncBenchmark(results, callback, cfg);
      }, cfg.delay_before_select);
    }
  }
  
  insertAsync();
}

function escapeBenchmark(results, callback, cfg) {
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
  
  results['escapes'] = Math.round(cfg.escape_count / total_time)
  
  insertAsyncBenchmark(results, callback, cfg);
}

function startBenchmark(results, callback, cfg) {
  var
    start_time,
    total_time;
  
  start_time = new Date();
  
  conn = new Mysql();
  
  conn.host     = cfg.host;
  conn.user     = cfg.user;
  conn.password = cfg.password;
  conn.database = cfg.database;
  
  conn.query("DROP TABLE IF EXISTS " + cfg.test_table + ";", function (err) {
    if (err) {
      console.log(err);
    }
    
    conn.query(cfg.create_table_query, function (err) {
      if (err) {
        console.log(err);
      }
      
      total_time = ((new Date()) - start_time) / 1000;
      
      results['init'] = total_time;
      
      escapeBenchmark(results, callback, cfg);
    });
  });
}

exports.run = function (callback, cfg) {
  var results = {};
  
  startBenchmark(results, callback, cfg);
};


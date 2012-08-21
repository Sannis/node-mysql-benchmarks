/**
 * Copyright (C) 2012, Oleg Efimov and other contributors
 *
 * See license text in LICENSE file
 */

// Require modules
var mysql = require('mysql'),
    conn;

function selectAsyncBenchmark(results, callback, cfg) {
  var
    start_time,
    total_time;
  
  start_time = new Date();

  var rows = [];
  conn.query("SELECT * FROM " + cfg.test_table)
      .on('error', function(err) {
        console.log(err);
      })
      .on('result', function(result) {
        rows.push(result);
      })
      .on('end', function() {
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
      conn.query(cfg.insert_query)
          .on('error', function(err) {
            console.log(err);
          })
          .on('end', insertAsync);
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

  conn = mysql.createConnection({
    host:     cfg.host,
    user:     cfg.user,
    port:     cfg.port,
    password: cfg.password,
    database: cfg.database,
    typeCast: false
  });
  
  conn.query("DROP TABLE IF EXISTS " + cfg.test_table)
      .on('error', function(err) {
        console.log(err);
      });
  conn.query(cfg.create_table_query)
      .on('error', function(err) {
        console.log(err);
      })
      .on('end', function() {
        total_time = ((new Date()) - start_time) / 1000;
        results['init'] = total_time;
        escapeBenchmark(results, callback, cfg);
      });
}

exports.run = function (callback, cfg) {
  var results = {};
  
  startBenchmark(results, callback, cfg);
};


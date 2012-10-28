/**
 * Copyright (C) 2012, Oleg Efimov and other contributors
 *
 * See license text in LICENSE file
 */

"use strict";

function benchmark() {
  // Require modules
  var
    util = require('util'),
    mysql = require('mysql-native'),
    helper = require('./helper'),
    conn;

  function selectAsyncBenchmark(results, callback, cfg) {
    var
      start_hrtime,
      rows = [];
    
    start_hrtime = process.hrtime();
    
    conn.query(cfg.select_query).on('row', function (row) {
      rows.push(row);
    }).on('end', function () {
      results.selects = Math.round(cfg.insert_rows_count / helper.hrtimeDeltaInSeconds(start_hrtime));
      
      // Close connection
      conn.close();
      
      // Finish benchmark
      callback(results);
    });
  }

  function insertAsyncBenchmark(results, callback, cfg) {
    var
      start_hrtime,
      i = 0;
    
    start_hrtime = process.hrtime();
    
    function insertAsync() {
      i += 1;
      if (i <= cfg.insert_rows_count) {
        conn.query(cfg.insert_query).on('end', function () {
          insertAsync();
        });
      } else {
        results.inserts = Math.round(cfg.insert_rows_count / helper.hrtimeDeltaInSeconds(start_hrtime));
        
        setTimeout(function () {
          selectAsyncBenchmark(results, callback, cfg);
        }, cfg.delay_before_select);
      }
    }
    
    insertAsync();
  }

  function reconnectAsyncBenchmark(results, callback, cfg) {
    var
      start_hrtime,
      i = 0;

    start_hrtime = process.hrtime();

    function reconnectAsync() {
      i += 1;
      if (i <= cfg.reconnect_count) {
        conn.close().on('end', function () {
          conn.auth(cfg.database, cfg.user, cfg.password).on('end', function (s) {
            reconnectAsync();
          });
        });

      } else {
        results.reconnects = Math.round(cfg.reconnect_count / helper.hrtimeDeltaInSeconds(start_hrtime));
        
        insertAsyncBenchmark(results, callback, cfg);
      }
    }
    
    reconnectAsync();
  }

  function initBenchmark(results, callback, cfg) {
    var start_hrtime;
    
    start_hrtime = process.hrtime();
    
    conn = mysql.createTCPClient(cfg.host, cfg.port);
    
    conn.auth(cfg.database, cfg.user, cfg.password).on('end', function (s) {
      conn.query("DROP TABLE IF EXISTS " + cfg.test_table).on('end', function () {
        conn.query(cfg.create_table_query).on('end', function () {
          results.init = helper.roundWithPrecision(helper.hrtimeDeltaInSeconds(start_hrtime), 3);
          
          //reconnectAsyncBenchmark(results, callback, cfg);
          insertAsyncBenchmark(results, callback, cfg);
        });
      });
    });
  }

  var cfg = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', function(data) {
    cfg += data;
  });
  process.stdin.on('end', function() {
    var results = {},
        callback = function() {
          process.stdout.write(JSON.stringify(results));
        };
    initBenchmark(results, callback, JSON.parse(cfg));
  });
  process.stdin.resume();
}

if (!module.parent) {
  benchmark();
}

exports.run = function (callback, cfg) {
  require('./helper').spawnBenchmark('node', [__filename], callback, cfg);
};

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
    mysql = require('mysql2'),
    helper = require('./helper'),
    conn;

  function selectAsyncBenchmark(results, callback, cfg, benchmark) {
    var start_hrtime;

    start_hrtime = process.hrtime();

    var rows = [];
    conn.query(cfg.select_query)
      .on('error', function(err) {
        console.error(err);
        process.exit();
      })
      .on('result', function(result) {
        rows.push(result);
      })
      .on('end', function() {
        results.selects = Math.round(cfg.insert_rows_count / helper.hrtimeDeltaInSeconds(start_hrtime))

        // Close connection
        conn.end();

        // Finish benchmark
        callback(results);
      });
  }

  function insertAsyncBenchmark(results, callback, cfg, benchmark) {
    var start_hrtime, i = 0;

    start_hrtime = process.hrtime();

    function insertAsync() {
      i += 1;
      if (i <= cfg.insert_rows_count) {
        conn.query(cfg.insert_query)
          .on('error', function(err) {
            console.error(err);
            process.exit();
          })
          .on('end', insertAsync);
      } else {
        results.inserts = Math.round(cfg.insert_rows_count / helper.hrtimeDeltaInSeconds(start_hrtime))

        setTimeout(function () {
          selectAsyncBenchmark(results, callback, cfg, benchmark);
        }, cfg.delay_before_select);
      }
    }

    insertAsync();
  }

  function escapeBenchmark(results, callback, cfg, benchmark) {
    var
      start_hrtime,
      i,
      escaped_string;

    start_hrtime = process.hrtime();

    for (i = 0; i < cfg.escapes_count; i += 1) {
      escaped_string = conn.escape(cfg.string_to_escape);
    }

    results.escapes = Math.round(cfg.escapes_count / helper.hrtimeDeltaInSeconds(start_hrtime))

    insertAsyncBenchmark(results, callback, cfg, benchmark);
  }

  function initBenchmark(results, callback, cfg) {
    var start_hrtime;
    
    start_hrtime = process.hrtime();

    conn = mysql.createConnection({
      host:     cfg.host,
      port:     cfg.port,
      user:     cfg.user,
      password: cfg.password,
      database: cfg.database,
      typeCast: benchmark.typeCast
    });
    conn.query("DROP TABLE IF EXISTS " + cfg.test_table)
      .on('error', function(err) {
        console.error(err);
        process.exit();
      });
    conn.query(cfg.create_table_query)
      .on('error', function(err) {
        console.error(err);
        process.exit();
      })
      .on('end', function() {
        results.init = helper.roundWithPrecision(helper.hrtimeDeltaInSeconds(start_hrtime), 3);

        escapeBenchmark(results, callback, cfg, benchmark);
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

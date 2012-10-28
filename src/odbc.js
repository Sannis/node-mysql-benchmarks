/**
 * Copyright (C) 2012, Oleg Efimov and other contributors
 *
 * See license text in LICENSE file
 */

"use strict";

function benchmark() {
  // Require modules
  var
    OdbcDatabase,
    helper = require('./helper'),
    conn;

  function fetchAllAsyncBenchmark(results, callback, cfg) {
    var start_hrtime;

    start_hrtime = process.hrtime();

    conn.query(cfg.select_query, function(error, result) {
      if (error) {
        console.error(error);
        process.exit();
      }

      results.selects =  Math.round(result.length / helper.hrtimeDeltaInSeconds(start_hrtime));

      // Finish benchmark
      callback(results);
    });
  }

  function insertAsyncBenchmark(results, callback, cfg) {
    var start_hrtime, i = 0;

    start_hrtime = process.hrtime();

    function insertAsync() {
      i += 1;
      if (i <= cfg.insert_rows_count) {
        conn.query(cfg.insert_query, function(error, result) {
          if (error) {
            console.error(error);
            process.exit();
          }

          insertAsync();
        });
      } else {
        results.inserts = Math.round(cfg.insert_rows_count / helper.hrtimeDeltaInSeconds(start_hrtime));

        setTimeout(function () {
          fetchAllAsyncBenchmark(results, callback, cfg);
        }, cfg.delay_before_select);
      }
    }

    insertAsync();
  }

  function initBenchmark(results, callback, cfg) {
    var
      start_hrtime,
      options_string;

    start_hrtime = process.hrtime();

    conn = new OdbcDatabase();

    options_string = "DRIVER={MySQL};DATABASE=" + cfg.database
                   + ";USER=" + cfg.user
                   + ";PASSWORD=" + cfg.password
                   + ";SERVER=" + cfg.host;

    conn.open(options_string, function(error) {
      if (error) {
        results.error = error.message;
        callback(results);
        return;
      }

      conn.query("DROP TABLE IF EXISTS " + cfg.test_table, function(error, rows) {
        if (error) {
          results.error = error.message;
          callback(results);
          return;
        }

        conn.query(cfg.create_table_query, function(error, rows) {
          if (error) {
            results.error = error.message;
            callback(results);
            return;
          }

          results.init = helper.roundWithPrecision(helper.hrtimeDeltaInSeconds(start_hrtime), 3);

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
    try {
      OdbcDatabase = require('odbc').Database;
    } catch (e) {
      callback(results);
      return;
    }
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

/**
 * Copyright (C) 2012, Oleg Efimov and other contributors
 *
 * See license text in LICENSE file
 */

"use strict";

function benchmark() {
  // Require modules
  var
    mysql = require('db-mysql'),
    helper = require('./helper'),
    conn;

  function fetchAllAsyncBenchmark(results, callback, cfg) {
    var start_hrtime;

    start_hrtime = process.hrtime();

    conn.query(cfg.select_query).execute(function(error) {
      if (error) {
        console.error(error);
        process.exit();
      }

      results.selects = Math.round(cfg.insert_rows_count / helper.hrtimeDeltaInSeconds(start_hrtime));

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
        conn.query(cfg.insert_query).execute(function(error) {
          if (error) {
            console.error(error);
            process.exit();
          }

          insertAsync();
        });
      } else {
        results.inserts =  Math.round(cfg.insert_rows_count / helper.hrtimeDeltaInSeconds(start_hrtime));

        setTimeout(function () {
          fetchAllAsyncBenchmark(results, callback, cfg);
        }, cfg.delay_before_select);
      }
    }

    insertAsync();
  }

  function escapeBenchmark(results, callback, cfg) {
    var
      start_hrtime,
      i,
      escaped_string;

    start_hrtime = process.hrtime();

    for (i = 0; i < cfg.escapes_count; i += 1) {
      escaped_string = conn.escape(cfg.string_to_escape);
    }

    results.escapes = Math.round(cfg.escapes_count / helper.hrtimeDeltaInSeconds(start_hrtime));

    insertAsyncBenchmark(results, callback, cfg);
  }

  function initBenchmark(results, callback, cfg) {
    var start_hrtime;

    start_hrtime = process.hrtime();

    new mysql.Database({
        hostname: cfg.host,
        user: cfg.user,
        password: cfg.password,
        database: cfg.database
    }).connect(function(error) {
      if (error) {
        console.error(error);
        process.exit();
      }

      conn = this;

      conn.query("DROP TABLE IF EXISTS " + cfg.test_table).execute(function(error) {
        if (error) {
          console.error(error);
          process.exit();
        }

        conn.query(cfg.create_table_query).execute(function(error) {
          if (error) {
            console.error(error);
            process.exit();
          }

          results.init = helper.roundWithPrecision(helper.hrtimeDeltaInSeconds(start_hrtime), 3);

          escapeBenchmark(results, callback, cfg);
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

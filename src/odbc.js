/**
 * Copyright (C) 2012, Dan VerWeire and other contributors
 *
 * See license text in LICENSE file
 */
if (!module.parent) {
  // Require modules
  var
    odbcDatabase,
    conn;

  function fetchAllAsyncBenchmark(results, callback, cfg) {
    var
      start_time,
      total_time,
      res,
      rows;

    start_time = Date.now();

    conn.query("SELECT * FROM " + cfg.test_table + ";", function(error, result) {
      if (error) {
          return console.log('ERROR: ' + error);
      }

      total_time = (Date.now() - start_time) / 1000;

      results['selects'] =  Math.round(result.length / total_time);

      // Finish benchmark
      callback(results);
    });
  }

  function insertAsyncBenchmark(results, callback, cfg) {
    var
      start_time,
      total_time,
      i = 0;

    start_time = Date.now();

    function insertAsync() {
      i += 1;
      if (i <= cfg.insert_rows_count) {
        conn.query(cfg.insert_query, function(error, result) {
          if (error) {
              return console.log('ERROR: ' + error);
          }

          insertAsync();
        });
      } else {
        total_time = (Date.now() - start_time) / 1000;

        results['inserts'] = Math.round(cfg.insert_rows_count / total_time);

        setTimeout(function () {
          fetchAllAsyncBenchmark(results, callback, cfg);
        }, cfg.delay_before_select);
      }
    }

    insertAsync();
  }

  function startBenchmark(results, callback, cfg) {
    var
      start_time,
      total_time,
      options_string;

    start_time = Date.now();

    conn = new odbcDatabase();

    options_string = "DRIVER={MySQL};DATABASE=" + cfg.database
                   + ";USER=" + cfg.user
                   + ";PASSWORD=" + cfg.password
                   + ";SERVER=" + cfg.host;

    conn.open(options_string, function(error) {
      if (error) {
          return console.log("CONNECTION ERROR: " + error);
      }

      conn.query("DROP TABLE IF EXISTS " + cfg.test_table + ";", function(error, rows) {
        if (error) {
          return console.log('ERROR: ' + error);
        }

        conn.query(cfg.create_table_query, function(error, rows) {
          if (error) {
            return console.log('ERROR: ' + error);
          }

          total_time = (Date.now() - start_time) / 1000;

          results['init'] = total_time;

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
          process.stdout.end(JSON.stringify(results));
        };
    try {
      odbcDatabase = require('odbc').Database;
    } catch (e) {
      callback(results);
      return;
    }
    startBenchmark(results, callback, JSON.parse(cfg));
  });
  process.stdin.resume();
}

exports.run = function (callback, cfg) {
  setTimeout(function() {
    var proc = require('child_process').spawn('node', [__filename]),
        exitEvent = (process.versions.node >= '0.8.0' ? 'close' : 'exit'),
        out = '';
    proc.stdout.setEncoding('ascii');
    proc.stdout.on('data', function(data) {
      out += data;
    });
    proc.on(exitEvent, function() {
      callback(JSON.parse(out));
    });
    proc.stdin.end(JSON.stringify(cfg));
  }, cfg.cooldown);
};

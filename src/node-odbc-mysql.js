/*
Copyright (C) 2010, Oleg Efimov <efimovov@gmail.com>

See license text in LICENSE file
*/

// Require modules
var
  util = require('util'),
  odbc = require('odbc').Database,
  conn;

function fetchAllAsyncBenchmark(callback, cfg) {
  var
    start_time,
    total_time,
    res,
    rows;

  start_time = new Date();

  conn.query("SELECT * FROM " + cfg.test_table + ";", function(error, result) {
    if (error) {
        return console.log('ERROR: ' + error);
    }

    total_time = ((new Date()) - start_time) / 1000;
    util.puts("**** " + result.length 
                      + " rows async (fetchAll) selected in "
                      + total_time + "s ("
                      + Math.round(result.length / total_time)
                      + "/s)");

    // Finish benchmark
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
      conn.query(cfg.insert_query, function(error, result) {
        if (error) {
            return console.log('ERROR: ' + error);
        }

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
        fetchAllAsyncBenchmark(callback, cfg);
      }, cfg.delay_before_select);
    }
  }

  insertAsync();
}

function startBenchmark(callback, cfg) {
  var
    start_time,
    total_time;

  start_time = new Date();

  conn = new odbc();

  conn.open("DRIVER={MySQL};DATABASE=" + cfg.database + ";USER=" + cfg.user + ";PASSWORD=" + cfg.password + ";SERVER=" + cfg.host
  /*{
      hostname: cfg.host,
      user: cfg.user,
      password: cfg.password,
      database: cfg.database
  }*/, function(error) {
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

        total_time = ((new Date()) - start_time) / 1000;
        util.puts("**** Benchmark initialization time is " + total_time + "s");

        insertAsyncBenchmark(callback, cfg);
      });
    });
  });
}

exports.run = function (callback, cfg) {
  startBenchmark(callback, cfg);
};


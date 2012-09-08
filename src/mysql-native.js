/**
 * Copyright (C) 2012, Oleg Efimov and other contributors
 *
 * See license text in LICENSE file
 */
if (!module.parent) {
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
    
    start_time = Date.now();
    
    conn.query(cfg.select_query).on('row', function (row) {
      rows.push(row);
    }).on('end', function () {
      total_time = (Date.now() - start_time) / 1000;
      
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
    
    start_time = Date.now();
    
    function insertAsync() {
      i += 1;
      if (i <= cfg.insert_rows_count) {
        conn.query(cfg.insert_query).on('end', function () {
          insertAsync();
        });
      } else {
        total_time = (Date.now() - start_time) / 1000;
        
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

    start_time = Date.now();

    function reconnectAsync() {
      i += 1;
      if (i <= cfg.reconnect_count) {
        conn.close().on('end', function () {
          conn.auth(cfg.database, cfg.user, cfg.password).on('end', function (s) {
            reconnectAsync();
          });
        });

      } else {
        total_time = (Date.now() - start_time) / 1000;
        
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
    
    start_time = Date.now();
    
    conn = mysql.createTCPClient(cfg.host, cfg.port);
    
    conn.auth(cfg.database, cfg.user, cfg.password).on('end', function (s) {
      conn.query("DROP TABLE IF EXISTS " + cfg.test_table).on('end', function () {
        conn.query(cfg.create_table_query).on('end', function () {
          total_time = (Date.now() - start_time) / 1000;
          
          results['init'] = total_time;
          
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
    startBenchmark(results, callback, JSON.parse(cfg));
  });
  process.stdin.resume();
}

exports.run = function (callback, cfg) {
  setTimeout(function() {
    process.stdout.write('Starting... ');
    var proc = require('child_process').spawn('node', [__filename]),
        exitEvent = (process.versions.node >= '0.8.0' ? 'close' : 'exit'),
        inspect = require('util').inspect,
        out = '';
    proc.stdout.setEncoding('ascii');
    proc.stdout.on('data', function(data) {
      out += data;
    });
    proc.stderr.setEncoding('utf8');
    proc.stderr.on('data', function(data) {
      console.error('stderr: ' + inspect(data));
    });
    proc.on(exitEvent, function() {
      callback(JSON.parse(out));
    });
    proc.stdin.end(JSON.stringify(cfg));
  }, cfg.cooldown);
};

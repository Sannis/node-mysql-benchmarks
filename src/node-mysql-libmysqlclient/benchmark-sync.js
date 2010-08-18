/*
Copyright (C) 2010, Oleg Efimov <efimovov@gmail.com>

See license text in LICENSE file
*/

// Load configuration
var cfg = require("../config").cfg;

// Require modules
var
  assert = require("assert"),
  sys = require("sys"),
  mysql_libmysqlclient = require("../../deps/node-mysql-libmysqlclient/mysql-libmysqlclient"),
  conn = mysql_libmysqlclient.createConnection(cfg.host, cfg.user, cfg.password, cfg.database),
  res,
  rows;

function startBenchmark() {
  var
    start_time,
    total_time;
  
  start_time = new Date();
  
  if (!conn.connected()) {
    sys.puts("Connection error: " + conn.connectErrno() + ", " + conn.connectError());
  }

  res = conn.query("DROP TABLE IF EXISTS " + cfg.test_table + ";");
  res = conn.query("SET max_heap_table_size=128M;");
  res = conn.query("CREATE TABLE " + cfg.test_table + " (alpha INTEGER, beta VARCHAR(255), pi FLOAT) TYPE=MEMORY;");
  
  total_time = ((new Date()) - start_time) / 1000;
  
  sys.puts("**** Benchmarks initialization time is " + total_time + "s");
}

function escapeBenchmark() {
  var
    start_time,
    total_time,
    i,
    string_to_escape = "str\\str\str\str\"str\'str\x00str",
    string_escaped;

  start_time = new Date();
  
  for (i = 0; i < cfg.escape_count; i += 1) {
    string_escaped = conn.escape(string_to_escape);
  }
  
  total_time = ((new Date()) - start_time) / 1000;
  
  sys.puts("**** " + cfg.escape_count + " escapes in " + total_time + "s (" + Math.round(cfg.escape_count / total_time) + "/s)");
}

function reconnectBenchmark() {
  var
    start_time,
    total_time,
    i,
    string_to_escape = "str\\str\str\str\"str\'str\x00str",
    string_escaped;

  start_time = new Date();
  
  for (i = 0; i < cfg.reconnect_count; i += 1) {
    conn.close();
    conn.connect(cfg.host, cfg.user, cfg.password, cfg.database);
  }
  
  total_time = ((new Date()) - start_time) / 1000;
  
  sys.puts("**** " + cfg.reconnect_count + " reconnects in " + total_time + "s (" + Math.round(cfg.reconnect_count / total_time) + "/s)");
}

function writeBenchmark() {
  var
    start_time,
    total_time,
    i;
  
  start_time = new Date();
  
  for (i = 0; i < cfg.insert_rows_count; i += 1) {
    res = conn.query("INSERT INTO " + cfg.test_table + " VALUES (1, 'hello', 3.141);");
  }
  
  total_time = ((new Date()) - start_time) / 1000;
  
  sys.puts("**** " + cfg.insert_rows_count + " insertions in " + total_time + "s (" + Math.round(cfg.insert_rows_count / total_time) + "/s)");
}

function readBenchmark() {
  var
    start_time,
    total_time;
  
  start_time = new Date();
  
  res = conn.query("SELECT * FROM " + cfg.test_table + ";", true);
  rows = res.fetchAll();
  assert.equal(rows.length, cfg.insert_rows_count);
  assert.deepEqual(rows[0], {alpha: 1, beta: 'hello', pi: 3.141});
  
  total_time = ((new Date()) - start_time) / 1000;
  
  sys.puts("**** " + cfg.insert_rows_count + " rows selected in " + total_time + "s (" + Math.round(cfg.insert_rows_count / total_time) + "/s)");
}

exports.run = function () {
  var
    start_time,
    total_time;
  
  start_time = new Date();
  
  startBenchmark();
  escapeBenchmark();
  reconnectBenchmark();
  writeBenchmark();
  readBenchmark();
  
  total_time = ((new Date()) - start_time) / 1000;
  
  sys.puts("** Total time is " + total_time + "s");
}


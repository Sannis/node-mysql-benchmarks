/**
 * Copyright (C) 2012, Oleg Efimov and other contributors
 *
 * See license text in LICENSE file
 */

var path = require('path');

exports.getConfig = function(factor) {
  var cfg = {
    // Database connection settings
    host: "127.0.0.1",
    port: 3307,
    user: "root",
    password: "root",
    database: "test",
    test_table: "test_table",

    // Benchmarks parameters
    escape_count: 1000000 * factor,
    string_to_escape: "str\\str\"str\'str\x00str",
    reconnect_count: 1000 * factor,
    insert_rows_count: 500000,// 10000 * factor,
    use_array_rows: false,

    global: {
      stat_interval: 5, // collect process metrics every n second(s)
      stat_dir: path.resolve(__dirname, '..', 'tmp'),
      delay_before_select: 5000, // ms
      cooldown: 10000, // ms
      more_stats: false
    },
  };

  cfg.create_table_query = "CREATE TABLE " + cfg.test_table +
                           " (alpha INTEGER, beta VARCHAR(128), pi FLOAT) " +
                           "ENGINE=MEMORY";

  cfg.insert_query = "INSERT INTO " + cfg.test_table +
                     " VALUES (1, 'hello', 3.141)";

  //cfg.select_query = "SELECT *, x'AABBCCDDEEFF00112233445566778899' AS binstr FROM " + cfg.test_table;
  cfg.select_query = "SELECT * FROM " + cfg.test_table;

  return cfg;
};


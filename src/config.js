/**
 * Copyright (C) 2012, Oleg Efimov and other contributors
 *
 * See license text in LICENSE file
 */

/*
> mysql -u root
CREATE DATABASE test DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci;
GRANT ALL ON test.* TO test@localhost IDENTIFIED BY "";
*/

exports.getConfig = function (factor) {
  var cfg = {
    // Database connection settings
    host: "127.0.0.1",
    port: 3306,
    user: "test",
    password: "",
    database: "test",
    test_table: "test_table",

    // Benchmarks parameters
    escape_count: 1000000 * factor,
    string_to_escape: "str\\str\"str\'str\x00str",
    reconnect_count: 1000 * factor,
    insert_rows_count: 10000 * factor,

    // Delay before assertion check (ms)
    delay_before_select: 1000
  };

  cfg.create_table_query = "CREATE TABLE " + cfg.test_table +
                           " (alpha INTEGER, beta VARCHAR(128), pi FLOAT) " +
                           "ENGINE=MEMORY;";

  cfg.insert_query = "INSERT INTO " + cfg.test_table +
                     " VALUES (1, 'hello', 3.141);";

  cfg.selected_row_example = {alpha: 1, beta: 'hello', pi: 3.1415926};

  return cfg;
};


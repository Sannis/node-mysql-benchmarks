/*
Copyright (C) 2010, Oleg Efimov <efimovov@gmail.com>

See license text in LICENSE file
*/

/*
> mysql -u root
CREATE DATABASE test  DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci;
GRANT ALL ON test.* TO test@localhost IDENTIFIED BY "";
*/

// Change only this variable to modify benchnark time
var factor = 1;

var cfg = {
  // Database connection settings
  host: "localhost",
  user: "test",
  password: "",
  database: "test",
  database_denied: "mysql",
  test_table: "test_table",
  charset: "utf8",
  
  escape_count: 1000000*factor,
  string_to_escape: "str\\str\str\str\"str\'str\x00str",
  reconnect_count: 10000*factor,
  insert_rows_count: 100000*factor,
  
  // Delay before assertion check (ms)
  delay_before_select: 1*1000
};

cfg.create_table_query = "CREATE TABLE " + cfg.test_table +
                         " (alpha INTEGER, beta VARCHAR(128), pi FLOAT) " +
                         "TYPE=MEMORY;";

cfg.insert_query = "INSERT INTO " + cfg.test_table +
                   " VALUES (1, 'hello', 3.141);";

cfg.selected_row_example = {alpha: 1, beta: 'hello', pi: 3.141};

exports.cfg = cfg;


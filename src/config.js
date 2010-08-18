/*
Copyright (C) 2010, Oleg Efimov <efimovov@gmail.com>

See license text in LICENSE file
*/

/*
> mysql -u root
CREATE DATABASE test  DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;
GRANT ALL ON test.* TO test@localhost IDENTIFIED BY "";
*/

exports.cfg = {
  // Database connection settings
  host: "localhost",
  user: "test",
  password: "",
  database: "test",
  database_denied: "mysql",
  test_table: "test_table",
  charset: "utf8",

  // Operations count for benchmarks
  escape_count: 1000000,
  reconnect_count: 10000,
  insert_rows_count: 100000
};


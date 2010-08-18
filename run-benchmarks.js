#!/usr/bin/env node
/*
Copyright (C) 2010, Oleg Efimov <efimovov@gmail.com>

See license text in LICENSE file
*/

var
  bindings_list = ['node-mysql-libmysqlclient'],
  sys = require("sys"),
  benchmark;


bindings_list.forEach(function (name) {
  sys.puts("\033[1mBenchmarking " + name + ":\033[22m");
  benchmark = require("./src/" + name + "/benchmark-sync");
  benchmark.run();
});

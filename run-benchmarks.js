#!/usr/bin/env node
/*
Copyright (C) 2010, Oleg Efimov <efimovov@gmail.com>

See license text in LICENSE file
*/

var
  bindings_list = ['Sannis-node-mysql-libmysqlclient', 'felixge-node-mysql', /*'stevebest-node-mysql',*/ 'PHP-MySQL'],
  //bindings_list = ['sidorares-nodejs-mysql-native'],
  sys = require('sys'),
  default_factor = 1,
  factor = default_factor,
  cfg;

if (process.argv[2] !== undefined) {
  factor = Math.abs(process.argv[2]);
  
  if (isNaN(factor)) {
    factor = default_factor;
  }
}

cfg = require("./src/config").getConfig(factor);

function runNextBenchmark() {
  if (bindings_list.length > 0) {
    var binding_name = bindings_list.shift();
    sys.puts("\033[1mBenchmarking " + binding_name + ":\033[22m");
    
    var benchmark = require("./src/" + binding_name);
    benchmark.run(function () {
      runNextBenchmark();
    }, cfg);
  } else {
    sys.puts("\033[1mAll benchmarks finished\033[22m");
  }
}

runNextBenchmark();


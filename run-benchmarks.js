#!/usr/bin/env node
/*
Copyright (C) 2010, Oleg Efimov <efimovov@gmail.com>

See license text in LICENSE file
*/

var
  bindings_list = ['CPP-MySQL',
                   'PHP-MySQL',
                   'Sannis-node-mysql-libmysqlclient',
                   'felixge-node-mysql',
                   //'stevebest-node-mysql',
                   'sidorares-nodejs-mysql-native',
                   'mariano-node-db-mysql'
                  ],
  sys = require('sys'),
  default_factor = 1,
  factor = default_factor,
  cfg,
  binding_filter;

if (process.argv[2] !== undefined) {
  factor = Math.abs(process.argv[2]);
  
  if (isNaN(factor)) {
    factor = default_factor;
  }
}

if (process.argv[3] !== undefined) {
  binding_filter = process.argv[3];
}

cfg = require("./src/config").getConfig(factor);

function runNextBenchmark() {
  if (bindings_list.length > 0) {
    var
      binding_name = bindings_list.shift(),
      benchmark = require("./src/" + binding_name);
    
    if (!binding_filter || (binding_name.match(binding_filter))) {
      sys.puts("\u001B[1mBenchmarking " + binding_name + ":\u001B[22m");
      
      benchmark.run(function () {
        runNextBenchmark();
      }, cfg);
    } else {
      sys.puts("\u001B[1mSkipping " + binding_name + "...\u001B[22m");
      
      runNextBenchmark();
    }
  } else {
    sys.puts("\u001B[1mAll benchmarks finished\u001B[22m");
  }
}

runNextBenchmark();


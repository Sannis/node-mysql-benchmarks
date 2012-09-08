#!/usr/bin/env node
/**
 * Copyright (C) 2012, Oleg Efimov and other contributors
 *
 * See license text in LICENSE file
 */

var
  bindings_list =
    [ 'C'
    , 'PHP'
    , 'db-mysql'
    , 'mysql'
    , 'mysql-libmysqlclient'
    , 'mysql-native'
    , 'odbc'
    , 'mariasql'
    ],
  util = require('util'),
  Table = require('cli-table'),
  default_factor = 1,
  factor,
  cfg,
  binding_filter,
  results = {};

factor = default_factor;
if (process.argv[2] !== undefined) {
  factor = Math.abs(process.argv[2]);
  
  if (isNaN(factor)) {
    factor = default_factor;
  }
}

if (process.argv[3] !== undefined) {
  binding_filter = process.argv[3];
}

cfg = require("../src/config").getConfig(factor);

function printResults() {
  var table = new Table({
    head: ["Author and module name", "Init", "Escapes", "Reconnects", "Inserts", "Selects"],
    colWidths: [34, 7, 11, 12, 9, 9],
    chars: {
      'top': '-',
      'top-mid':'+',
      'top-left':'+',
      'top-right':'+',
      'bottom': '-',
      'bottom-mid':'+',
      'bottom-left':'+',
      'bottom-right':'+',
      'left': '|',
      'left-mid': '+',
      'mid': '-',
      'mid-mid': '+',
      'right': '|',
      'right-mid': '+'
    }
  }), name;
  
  for (name in results) {
    if (results.hasOwnProperty(name)) {
      table.push([ name
        , results[name]['init']       || '-'
        , results[name]['escapes']    || '-'
        , results[name]['reconnects'] || '-'
        , results[name]['inserts']    || '-'
        , results[name]['selects']    || '-'
      ]);
    }
  }
  
  // Output results
  util.puts("\n\u001B[1mResults (init time in seconds, other values are operations per second):\u001B[22m");
  console.log(table.toString());
}

function runNextBenchmark() {
  if (bindings_list.length > 0) {
    var
      binding_name = bindings_list.shift(),
      benchmark = require("../src/" + binding_name);
    
    if (!binding_filter || (binding_name.match(binding_filter))) {
      util.print("Benchmarking " + binding_name + "... ");
      
      benchmark.run(function (binding_results) {
        util.print("Done.\n");
        results[binding_name] = binding_results;
        
        runNextBenchmark();
      }, cfg);
    } else {
      util.puts("Skipping " + binding_name + ".");
      
      runNextBenchmark();
    }
  } else {
    util.puts("\u001B[1mAll benchmarks finished.\u001B[22m");
    
    printResults();
  }
}

util.puts("\u001B[1mBenchmarking...\u001B[22m");
runNextBenchmark();

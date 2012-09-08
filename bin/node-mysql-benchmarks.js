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
  ArgumentParser = require('argparse').ArgumentParser,
  Table = require('cli-table'),
  results = {};

var parser = new ArgumentParser({
  description: require('../package.json').description,
  version: require('../package.json').version,
  addHelp: true
});
parser.addArgument(
  [ '-f', '--factor' ],
  {
    action: 'store',
    defaultValue: 1,
    type: 'float',
    help: 'Factor to change benchmark operations number (default: 1).'
  }
);
parser.addArgument(
  [ '-s', '--skip' ],
  {
    action: 'append',
    defaultValue: [],
    help: 'Benchmark name to skip.'
  }
);
var args = parser.parseArgs();

var cfg = require("../src/config").getConfig(args.factor);

function printResults() {
  var table = new Table({
    head: ["Module name", "Init", "Escapes", "Reconnects", "Inserts", "Selects"],
    colWidths: [22, 7, 11, 12, 9, 9],
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
  util.puts("\n\u001B[1mResults:\u001B[22m");
  console.log(table.toString());
  util.puts("\u001B[1mInit time in seconds (less is better), other values are operations per second (more is better).\u001B[22m");
}

function inArray(what, where) {
  for (var i = 0, length = where.length; i < length; i++) {
    if (what == where[i]) {
      return true;
    }
  }
  return false;
}

function runNextBenchmark() {
  if (bindings_list.length > 0) {
    var
      binding_name = bindings_list.shift(),
      benchmark = require("../src/" + binding_name);

    if (args.skip.length == 0 || inArray(binding_name, args.skip)) {
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

util.puts("\u001B[1mBenchmarking with factor " + args.factor + "...\u001B[22m");
runNextBenchmark();

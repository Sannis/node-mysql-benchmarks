#!/usr/bin/env node
/**
 * Copyright (C) 2012, Oleg Efimov and other contributors
 *
 * See license text in LICENSE file
 */

"use strict";

var
  util = require('util'),
  ArgumentParser = require('argparse').ArgumentParser,
  Table = require('cli-table'),
  results = {};

// Parse cli arguments
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
    help: 'Module to skip.'
  }
);
parser.addArgument(
  [ '-q', '--quiet' ],
  {
    action: 'storeTrue',
    defaultValue: false,
    help: 'Be quiet.'
  }
);
var args = parser.parseArgs();

// Get config
var cfg = require("../src/config").getConfig(args.factor);

// Define progress logger
var printProgress = function (msg) {
  util.print(msg);
};
if (args.quiet) {
  printProgress = function () {
    util.print('.');
  };
}

function printResults() {
  var table = new Table({
    head: ["Name", "Async", "TypeCast", "Init", "Escapes", "Reconnects", "Inserts", "Selects"],
    colWidths: [30, 7, 10, 7, 11, 12, 9, 9],
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
      table.push([
        name,

        cfg.benchmarksO[name].async    ? 'V' : '',
        cfg.benchmarksO[name].typeCast ? 'V' : '',

        results[name].init       || '-',
        results[name].escapes    || '-',
        results[name].reconnects || '-',
        results[name].inserts    || '-',
        results[name].selects    || '-'
      ]);
    }
  }
  
  // Output results
  util.print("\n\u001B[1mResults:\u001B[22m\n");
  console.log(table.toString());
  util.print("\u001B[1mInit time in seconds (doesn't matter), other values are operations/rows per second (more is better).\u001B[22m\n");
}

function inArray(what, where) {
  for (var i = 0, length = where.length; i < length; i++) {
    if (what === where[i]) {
      return true;
    }
  }
  return false;
}

var benchmarksA = cfg.benchmarksA;

function runNextBenchmark() {
  if (benchmarksA.length > 0) {
    var benchmark = benchmarksA.shift();

    if (args.skip.length === 0 || !inArray(benchmark.module, args.skip)) {
      printProgress("Benchmarking '" + benchmark.name + "'... ");

      require("../src/" + benchmark.module).run(function (benchmark_results) {
        printProgress("Done.\n");
        results[benchmark.name] = benchmark_results;

        printProgress("Cooldown...\n");
        if (benchmarksA.length > 0) {
          setTimeout(function () {
            runNextBenchmark();
          }, cfg.cooldown);
        } else {
          printResults();
        }
      }, cfg, benchmark);
    } else {
      printProgress("Skipping '" + benchmark.name + "'.\n");

      runNextBenchmark();
    }
  } else {
    printResults();
  }
}

util.print("\u001B[1mBenchmarking with factor " + args.factor + "...\u001B[22m\n");
runNextBenchmark();

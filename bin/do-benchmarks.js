#!/usr/bin/env node
// syntax: do-benchmark [factor] [module filter]
var fs = require('fs'), cp = require('child_process'), path = require('path');

var DEFAULT_FACTOR = 6;

var factor,
    cfg,
    module_filter,
    results = {},
    modules = [
      'C',
      'PHP',
      'mysql',
      'mysql2',
      'mysql-libmysqlclient',
      'mysql-native',
      'mariasql',
    ];

factor = DEFAULT_FACTOR;

if (process.argv[2] !== undefined) {
  if (/^\d+$/.test(process.argv[2]))
    factor = parseInt(process.argv[2], 10);
  else
    module_filter = process.argv[2];
} else if (process.argv[3] !== undefined)
  module_filter = process.argv[3];

if (module_filter)
  modules = modules.filter(function(v) { return v.match(module_filter); });

cfg = require('./config').getConfig(factor);

function printResults() {
  var header = ['module'].concat(tests).join(','),
      name;

  console.log('\n\u001B[1mResults (init time in seconds, other values in ops/s):\u001B[22m');

  console.log(header);
  var separator = new Buffer(header.length);
  separator.fill('='.charCodeAt(0));
  console.log(separator.toString());

  for (name in results) {
    process.stdout.write(name);
    tests.forEach(function(t) {
      process.stdout.write(',' + (results[name][t] || 0));
    });
    process.stdout.write('\n');
  }
}

var tests = ['init', 'escapes', /*'reconnects',*/ 'inserts', 'selects'];

function runNextBenchmark() {
  if (modules.length) {
    var module_name = modules.shift(),
        benchmark = require('../src/' + module_name + '/_main');

    console.log('Benchmarking ' + module_name + '...');

    var t = 0;
    results[module_name] = {};

    function runNextTest() {
      console.log(' - starting "' + tests[t] + '" test ...');
      benchmark.run(cfg, tests[t], function(val, csv) {
        results[module_name][tests[t]] = (typeof val === 'number' ? val : 0);
        if (cfg.global.more_stats) {
          fs.writeFileSync(path.resolve(cfg.global.stat_dir, module_name + '.'
                                        + tests[t] + '.csv'), csv);
        }

        console.log(' - finished "' + tests[t] + '" test');

        if (++t === tests.length) {
          console.log('Finished benchmarking ' + module_name);
          if (modules.length) {
            console.log('Cooling down ...');
            setTimeout(runNextBenchmark, cfg.global.cooldown);
          } else
            runNextBenchmark();
        } else if (tests[t] === 'selects')
          setTimeout(runNextTest, cfg.global.delay_before_select);
        else
          runNextTest();
      });
    }

    runNextTest();
  } else {
    console.log('\u001B[1mAll benchmarks finished.\u001B[22m');
    printResults();
  }
}

if (fs.existsSync(cfg.global.stat_dir)) {
  cp.exec('rm -f ' + cfg.global.stat_dir + '/*', function(err, stdout, stderr) {
    startBenchmarks();
  });
} else {
  fs.mkdirSync(cfg.global.stat_dir);
  startBenchmarks();
}

function startBenchmarks() {
  console.log('\u001B[1mBenchmarking...\u001B[22m');
  runNextBenchmark();
}

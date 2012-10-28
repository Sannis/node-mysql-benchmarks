/**
 * Copyright (C) 2012, Oleg Efimov and other contributors
 *
 * See license text in LICENSE file
 */

"use strict";

exports.spawnBenchmark = function (file, args, callback, cfg, benchmark) {
  var child = require('child_process').spawn(file, args),
    exitEvent = (require('semver').gt(process.versions.node, '0.8.0') ? 'close' : 'exit'),
    out = '';

  child.stdout.setEncoding('ascii');
  child.stdout.on('data', function (data) {
    out += data;
  });
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', function (data) {
    if (/^execvp\(\)/.test(data.toString('ascii'))) {
      console.error("Failed to start child process for benchmark.");
    }
    console.error('stderr: ' + require('util').inspect(data));
  });
  child.on(exitEvent, function () {
    callback(JSON.parse(out));
  });
  if (benchmark) {
    cfg.benchmark = benchmark;
  }
  child.stdin.end(JSON.stringify(cfg));
};

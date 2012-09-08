/**
 * Copyright (C) 2012, Oleg Efimov and other contributors
 *
 * See license text in LICENSE file
 */

// Require modules
var
  spawn = require('child_process').spawn,
  inspect = require('util').inspect,
  exitEvent = (process.versions.node >= '0.8.0' ? 'close' : 'exit');

exports.run = function (callback, cfg) {
  var
    proc,
    args = [],
    key,
    results = '';

  process.stdout.write('Starting... ');

  for (key in cfg) {
    if (cfg.hasOwnProperty(key)) {
      args.push('--' + key);
      
      if (typeof cfg[key] === 'boolean') {
        args.push(cfg[key] ? '1' : '0');
      } else if (typeof cfg[key] !== 'object') {
        args.push(cfg[key]);
      }
    }
  }

  proc = spawn(__dirname + '/../build/benchmark-cpp', args);

  proc.stdout.on('data', function (data) {
    results += data;
  });

  proc.stderr.setEncoding('utf8');
  proc.stderr.on('data', function (data) {
    if (/^execvp\(\)/.test(data.toString('ascii'))) {
      console.error("Failed to start child process for C++ benchmark.");
    }
    console.error('stderr: ' + inspect(data));
  });

  proc.on(exitEvent, function () {
    try {
      results = JSON.parse(results);
    } catch (e) {}
    
    // Finish benchmark
    callback(results);
  });
};


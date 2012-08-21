/**
 * Copyright (C) 2012, Oleg Efimov and other contributors
 *
 * See license text in LICENSE file
 */

// Require modules
var
  util = require('util'),
  spawn = require('child_process').spawn;

exports.run = function (callback, cfg) {
  var
    cpp_child,
    args = [],
    key,
    results = '';

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

  cpp_child = spawn(__dirname + '/../build/Release/benchmark', args);

  cpp_child.stdout.on('data', function (data) {
    results += data;
  });

  cpp_child.stderr.on('data', function (data) {
    if (/^execvp\(\)/.test(data.asciiSlice(0, data.length))) {
      util.puts("Failed to start child process for C++ benchmark.");
    }
    util.puts('stderr: ' + data);
  });

var exitEvent = (process.versions.node >= '0.8.0' ? 'close' : 'exit');
  cpp_child.on(exitEvent, function () {
    try {
      results = JSON.parse(results);
    } catch (e) {}
    
    // Finish benchmark
    callback(results);
  });
};


/*
Copyright (C) 2010, Oleg Efimov <efimovov@gmail.com>

See license text in LICENSE file
*/

// Require modules
var
  util = require('util'),
  spawn = require('child_process').spawn;

exports.run = function (callback, cfg) {
  var
    cpp_child,
    args = [],
    i;

  for (i in cfg) {
    if (cfg.hasOwnProperty(i)) {
      args.push('--' + i);
      
      if (typeof cfg[i] === 'boolean') {
        args.push(cfg[i] ? '1' : '0');
      } else if (typeof cfg[i] !== 'object') {
        args.push(cfg[i]);
      }
    }
  }

  cpp_child = spawn(__dirname + '/../build/Release/benchmark', args);

  cpp_child.stdout.on('data', function (data) {
    util.print(data);
  });

  cpp_child.stderr.on('data', function (data) {
    if (/^execvp\(\)/.test(data.asciiSlice(0, data.length))) {
      util.puts("Failed to start child process for C++ benchmark.");
    }
    util.print('stderr: ' + data);
  });

  cpp_child.on('exit', function (code) {
    // Finish benchmark
    callback.apply();
  });
};


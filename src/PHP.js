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
    php_child,
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

  php_child = spawn('./src/benchmark.php', args);
  
  php_child.stdout.on('data', function (data) {
    results += data;
  });

  php_child.stderr.on('data', function (data) {
    if (/^execvp\(\)/.test(data.asciiSlice(0, data.length))) {
      util.puts("Failed to start child process for PHP benchmark.");
    }
    util.puts('stderr: ' + data);
  });

  php_child.on('exit', function (code) {
    try {
      results = JSON.parse(results);
    } catch (e) {}
    
    // Finish benchmark
    callback(results);
  });
};


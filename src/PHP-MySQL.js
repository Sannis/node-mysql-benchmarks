/*
Copyright (C) 2010, Oleg Efimov <efimovov@gmail.com>

See license text in LICENSE file
*/

// Require modules
var
  sys = require('sys'),
  spawn = require('child_process').spawn;

exports.run = function (callback, cfg) {
  var
    php_child,
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
  
  php_child = spawn('./src/benchmark.php', args);
  
  php_child.stdout.on('data', function (data) {
    sys.print(data);
  });
  
  php_child.stderr.on('data', function (data) {
    if (/^execvp\(\)/.test(data.asciiSlice(0, data.length))) {
      sys.puts("Failed to start child process for PHP benchmark.");
    }
  });
  
  php_child.on('exit', function (code) {
    // Finish benchmark
    callback.apply();
  });
};


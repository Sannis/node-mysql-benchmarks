/*
Copyright (C) 2010, Oleg Efimov <efimovov@gmail.com>

See license text in LICENSE file
*/

// Require modules
var
  sys = require('sys'),
  spawn = require('child_process').spawn,
  global_start_time,
  global_total_time;

exports.run = function (callback, cfg) {
  var
    php_child,
    args = [],
    i;
  
  for (i in cfg) {
    args.push('--' + i);
    
    if (typeof cfg[i] === 'boolean') {
      args.push(cfg[i] ? '1' : '0');
    } else if (typeof cfg[i] !== 'object') {
      args.push(cfg[i]);
    }
  }
  
  global_start_time = new Date();
  
  php_child = spawn('./src/benchmark.php', args);
  
  php_child.stdout.on('data', function (data) {
    sys.print(data);
  });
  
  php_child.stderr.on('data', function (data) {
    if (/^execvp\(\)/.test(data.asciiSlice(0, data.length))) {
      sys.puts("Failed to start child process for PHP benchmark.");
    }
    //sys.print('stderr: ' + data);
  });
  
  php_child.on('exit', function (code) {
    // Finish benchmark
    global_total_time = ((new Date()) - global_start_time - cfg.delay_before_select) / 1000;
    sys.puts("** Total time is " + global_total_time + "s");
    
    callback.apply();
  });
};


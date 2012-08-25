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
  setTimeout(function() {
    process.stdout.write('starting ... ');
    var
      proc,
      results = '';

    proc = spawn('src/benchmark.php');
    
    proc.stdout.on('data', function (data) {
      results += data;
    });

    proc.stderr.setEncoding('utf8');
    proc.stderr.on('data', function (data) {
      if (/^execvp\(\)/.test(data)) {
        console.error("Failed to start child process for PHP benchmark.");
      }
      console.error('stderr: ' + inspect(data));
    });

    proc.on('exit', function (code) {
      try {
        results = JSON.parse(results);
      } catch (e) {}
      
      // Finish benchmark
      callback(results);
    });

    proc.stdin.end(JSON.stringify(cfg));
  }, cfg.cooldown);
};

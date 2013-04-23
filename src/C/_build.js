#!/usr/bin/env node
var cp = require('child_process'), fs = require('fs'), path = require('path');

fs.readdirSync(__dirname).forEach(function(f) {
  if (/.cc$/.test(f)) {
    cp.exec('g++ -O2 -std=c++0x -o ' + __dirname + '/bin/' + path.basename(f, '.cc') + ' ' + __dirname + '/' + f + ' -l:libmysqlclient.a -lssl -lrt -lz -ldl -fPIC', function(err, stdout, stderr) {
      if (err) throw err;
      if (stderr.length)
        console.error(stderr);
    });
  }
});

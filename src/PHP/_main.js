var spawn = require('child_process').spawn,
    inspect = require('util').inspect;
var Stats = require(__dirname + '/../../util/Stats');

exports.run = function(cfg, test, callback) {
  var results = '', proc, stats;

  proc = spawn(__dirname + '/' + test + '.php');
  if (cfg.global.more_stats)
    stats = new Stats(proc.pid, cfg.global.stat_interval);

  proc.stdout.setEncoding('ascii');
  proc.stdout.on('data', function(data) {
    results += data;
  });
  proc.stderr.setEncoding('ascii');
  proc.stderr.on('data', function(data) {
    console.error('stderr: ' + inspect(data));
  });
  proc.on('close', function() {
    try {
      results = JSON.parse(results);
    } catch (e) {}

    if (cfg.global.more_stats) {
      stats.done(function(csv) {
        callback(results, csv);
      });
    } else
      callback(results);
  });
  proc.stdin.end(JSON.stringify(cfg));
};

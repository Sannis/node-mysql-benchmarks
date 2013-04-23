var spawn = require('child_process').spawn,
    inspect = require('util').inspect;
var Stats = require(__dirname + '/../../util/Stats');

exports.run = function(cfg, test, callback) {
  var proc, args = [], key, results = '', stats;

  for (key in cfg) {
    if (cfg.hasOwnProperty(key) && typeof cfg[key] !== 'object') {
      args.push('--' + key);
      
      if (typeof cfg[key] === 'boolean')
        args.push(cfg[key] ? '1' : '0');
      else
        args.push(cfg[key]);
    }
  }

  proc = spawn(__dirname + '/bin/' + test, args);
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
};


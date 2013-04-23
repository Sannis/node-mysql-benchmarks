var cp = require('child_process');
var PAGESIZE;

function Stats(pid, interval) {
  interval || (interval = 5);
  var self = this;
  this.buffer = '';
  this.proc = cp.spawn(__dirname + '/Stats.sh', [pid, interval, __dirname]);
  this.proc.stdout.on('data', function(data) {
    self.buffer += data.toString('ascii');
  });
}
Stats.prototype.done = function(cb) {
  var self = this;
  this.proc.once('close', function redo() {
    if (PAGESIZE === undefined)
      return getPagesize(redo);

    cb('%CPU,PSS\n'
       + self.buffer.replace(/^[ \t]+/mg, '')
             .replace(/^([\d\.]+)\n/mg, '$1,')
             .replace(/^([\d\.]+),(.*)$/mg, function(m, cpu, mem) {
               if (mem.length === 0)
                 return cpu + ',0';
               else
                 return cpu + ',' + (parseInt(mem, 10) * PAGESIZE);
             })
    );
  });
  this.proc.kill();
};

function getPagesize(cb) {
  cp.exec('getconf PAGESIZE', function(err, stdout, stderr) {
    if (err)
      throw err;
    PAGESIZE = parseInt(stdout.trim(), 10);
    cb();
  });
}

module.exports = Stats;

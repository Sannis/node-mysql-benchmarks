var Client = require('mariasql');

module.exports = function(cb) {
  var cfg = '';
  var env = {
    cfg: undefined,
    do_init: function(cb, clearTable) {
      if (clearTable === undefined)
        clearTable = true;

      var conn = new Client();
      conn.connect({
        host: cfg.host,
        port: cfg.port,
        user: cfg.user,
        password: cfg.password,
        db: cfg.database
      });

      conn.once('connect', function() {
        if (clearTable) {
          conn.query('DROP TABLE IF EXISTS ' + cfg.test_table)
              .on('error', function(err) {
                console.error(err);
              });
          conn.query(cfg.create_table_query)
              .on('error', function(err) {
                console.error(err);
              })
              .on('end', cb);
        } else
          cb();
      });

      return conn;
    }
  };
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', function(data) {
    cfg += data;
  });
  process.stdin.on('end', function() {
    env.cfg = cfg = JSON.parse(cfg);
    cb(env);
  });
  process.stdin.resume();
};
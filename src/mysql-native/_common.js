var mysql = require('mysql-native');

module.exports = function(cb) {
  var cfg = '';
  var env = {
    cfg: undefined,
    do_init: function(cb, clearTable) {
      if (clearTable === undefined)
        clearTable = true;

      var conn = mysql.createTCPClient(cfg.host, cfg.port);
      conn.set('row_as_hash', !cfg.use_array_rows);
      conn.auth(cfg.database, cfg.user, cfg.password)
          .on('authorized', function() {
            if (clearTable) {
              conn.query('DROP TABLE IF EXISTS ' + cfg.test_table)
                  .on('end', function() {
                    conn.query(cfg.create_table_query)
                        .on('end', cb);
                  });
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
var mysql = require('mysql-libmysqlclient');

module.exports = function(cb) {
  var cfg = '';
  var env = {
    cfg: undefined,
    do_init: function(cb, clearTable) {
      if (clearTable === undefined)
        clearTable = true;

      var conn = new mysql.bindings.MysqlConnection();
      conn.connect(cfg.host, cfg.user, cfg.password, cfg.database, cfg.port,
        function(err) {
          if (clearTable) {
            conn.query('DROP TABLE IF EXISTS ' + cfg.test_table, function(err) {
              if (err)
                console.error(err);
              conn.query(cfg.create_table_query, function(err) {
                if (err)
                  console.error(err);
                cb();
              });
            });
          } else
            cb();
        }
      );

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
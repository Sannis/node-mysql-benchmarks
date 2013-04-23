#include "_common.h"

void do_benchmark_reconnect(long int count) {
  long int i = 0;

  for (i = 0; i < count; i++) {
    mysql_close(conn);

    conn = mysql_init(NULL);
    if (!conn)
      exit(1);

    if (!mysql_real_connect(conn,
                            cfg["host"].c_str(),
                            cfg["user"].c_str(),
                            cfg["password"].length() ? cfg["password"].c_str() : NULL,
                            cfg["database"].c_str(),
                            atoi(cfg["port"].c_str()), NULL, 0)) {
      fprintf(stderr, "Error %d: %s\n", mysql_errno(conn), mysql_error(conn));
      mysql_close(conn);
      exit(1);
    }
  }
}

int main(int argc, char *argv[]) {
  long int count;

  parseCfg(argc, argv);

  clearTable = false;
  do_init(0);

  count = atol(cfg["reconnect_count"].c_str());
  do_benchmark(do_benchmark_reconnect, "reconnects", count);

  mysql_close(conn);

  return 0;
}

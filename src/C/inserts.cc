#include "_common.h"

void do_benchmark_inserts(long int count) {
  long int i = 0;
  const char* query = cfg["insert_query"].c_str();

  for (i = 0; i < count; i++)
    mysql_query(conn, query);
}

int main(int argc, char *argv[]) {
  long int count;

  parseCfg(argc, argv);

  do_init(0);

  count = atol(cfg["insert_rows_count"].c_str());
  do_benchmark(do_benchmark_inserts, "inserts", count);

  mysql_close(conn);

  return 0;
}

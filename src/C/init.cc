#include "_common.h"

int main(int argc, char *argv[]) {
  parseCfg(argc, argv);

  do_benchmark(do_init, "init", 0);

  mysql_close(conn);

  return 0;
}

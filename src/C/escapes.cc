#include "_common.h"

void do_benchmark_escape_string(long int count) {
  long int i = 0;
  char *escaped_string;
  const char *string_to_escape = cfg["string_to_escape"].c_str();
  const int string_to_escape_len = cfg["string_to_escape"].length();

  for (i = 0; i < count; i++) {
    escaped_string = new char[2 * string_to_escape_len + 1];
    mysql_real_escape_string(conn, escaped_string, string_to_escape, string_to_escape_len);
    delete[] escaped_string;
  }
}

int main(int argc, char *argv[]) {
  long int count;

  parseCfg(argc, argv);

  do_init(0);

  count = atol(cfg["escape_count"].c_str());
  do_benchmark(do_benchmark_escape_string, "escapes", count);

  mysql_close(conn);

  return 0;
}

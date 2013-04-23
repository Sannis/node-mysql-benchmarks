#include "_common.h"

void do_benchmark_select(long int count) {
  MYSQL_RES* result;
  MYSQL_ROW row;
  MYSQL_FIELD *fields;
  unsigned int i, n_fields;
  long int rowcount = 0;

  mysql_query(conn, cfg["select_query"].c_str());
  result = mysql_use_result(conn);
  n_fields = mysql_num_fields(result);
  fields = mysql_fetch_fields(result);

  if (cfg["use_array_rows"] == "0") {
    std::vector<std::unordered_map<const char*, const char*> > rows;
    while((row = mysql_fetch_row(result))) {
      ++rowcount;
      std::unordered_map<const char*, const char*> map_fields;
      for (i = 0; i < n_fields; ++i)
        map_fields[fields[i].name] = strdup(row[i]);
      rows.push_back(map_fields);
    }
  } else {
    std::vector<std::vector<const char*> > rows;
    while((row = mysql_fetch_row(result))) {
      ++rowcount;
      std::vector<const char*> vals;
      for (i = 0; i < n_fields; ++i)
        vals.push_back(strdup(row[i]));
      rows.push_back(vals);
    }
  }

  mysql_free_result(result);

  if (rowcount != count) {
    fprintf(stderr, "Got %ld rows, expected %ld\n", rowcount, count);
    exit(1);
  }
}

int main(int argc, char *argv[]) {
  long int count;

  parseCfg(argc, argv);

  clearTable = false;
  do_init(0);

  count = atol(cfg["insert_rows_count"].c_str());
  do_benchmark(do_benchmark_select, "selects", count);

  mysql_close(conn);

  return 0;
}

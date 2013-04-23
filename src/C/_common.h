#ifndef __COMMON_H__
#define __COMMON_H__

#ifndef _GNU_SOURCE
# define _GNU_SOURCE
#endif

#include <unistd.h>
#include <vector>
#include <cstring>
#include <string>
#include <cstdio>
#include <cstdlib>
#include <unordered_map>
#include <getopt.h>
#include <mysql/mysql.h>

MYSQL *conn;
std::unordered_map<std::string, std::string> cfg;
bool clearTable = true;

/*
author: jbenet
*/

#include <ctime>

#ifdef __MACH__
# include <mach/clock.h>
# include <mach/mach.h>
#endif


void current_utc_time(struct timespec *ts) {
#ifdef __MACH__ // OS X does not have clock_gettime, use clock_get_time
  clock_serv_t cclock;
  mach_timespec_t mts;
  host_get_clock_service(mach_host_self(), CALENDAR_CLOCK, &cclock);
  clock_get_time(cclock, &mts);
  mach_port_deallocate(mach_task_self(), cclock);
  ts->tv_sec = mts.tv_sec;
  ts->tv_nsec = mts.tv_nsec;
#else
  clock_gettime(CLOCK_REALTIME, ts);
#endif
}

//
// Utility function for benchmarking
//

void do_benchmark(void (*f)(long int), const char *key, long int count) {
  timespec start, finish;

  long double delta = 0;
  long int operations = 0;

  current_utc_time(&start);
  f(count);
  current_utc_time(&finish);

  delta = static_cast<long double>(finish.tv_sec - start.tv_sec)
          + static_cast<long double>(finish.tv_nsec - start.tv_nsec) / 1.0e9;

  if (count > 0) {
    operations = static_cast<long int>(static_cast<long double>(count) / delta);
    printf("%ld", operations);
  } else
    printf("%.3Lf", delta);
  fflush(stdout);
}

void do_init(long int count) {
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

  if (clearTable) {
    char drop_query[128];
    sprintf(drop_query, "DROP TABLE IF EXISTS %s", cfg["test_table"].c_str());
    mysql_query(conn, drop_query);
    mysql_query(conn, cfg["create_table_query"].c_str());
  }
}

void parseCfg(int argc, char *argv[]) {
  int c;
  int option_index = 0;

  static struct option long_options[] = {
    {"host", required_argument, NULL, 0},
    {"port", required_argument, NULL, 0},
    {"user", required_argument, NULL, 0},
    {"password", required_argument, NULL, 0},
    {"database", required_argument, NULL, 0},
    {"test_table", required_argument, NULL, 0},
    {"create_table_query", required_argument, NULL, 0},
    {"select_query", required_argument, NULL, 0},
    {"escape_count", required_argument, NULL, 0},
    {"string_to_escape", required_argument, NULL, 0},
    {"reconnect_count", required_argument, NULL, 0},
    {"insert_rows_count", required_argument, NULL, 0},
    {"insert_query", required_argument, NULL, 0},
    {"use_array_rows", required_argument, NULL, 0}
  };

  while ((c = getopt_long(argc, argv, "", long_options, &option_index)) != -1) {
    switch (c) {
      case 0:
        if (optarg)
          cfg[long_options[option_index].name] = optarg;
        else
          cfg[long_options[option_index].name] = "";
        break;
      default:
        break;
    }
  }
}
#endif

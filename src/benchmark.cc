/*
Copyright (C) 2010, Oleg Efimov <efimovov@gmail.com>

See license text in LICENSE file
*/

#ifndef _GNU_SOURCE
# define _GNU_SOURCE
#endif
#include <getopt.h>

#include <mysql.h>

#include <map>
#include <string>
#include <cstdio>
#include <cstdlib>
#include <ctime>

MYSQL *conn;

std::map<std::string, std::string> cfg;

//
// Utility void
//

void do_benchmark(void (*f)(int), const char *title, int count = 0) {
    clock_t start = 0, finish = 0;
    double delta = 0;

    start = clock();
    f(count);
    finish = clock();

    delta = static_cast<double>(finish-start)/CLOCKS_PER_SEC;

    if (count > 0) {
        printf("%s %.2lfs (%ld/s)\n", title, delta,
               static_cast<long int>(static_cast<double>(count)/delta));
    } else {
        printf("%s %.2lfs\n", title, delta);
    }
}

//
// Benchmarking functions
//

/*void do_benchmark_select() {
    rows = array();

    r = mysql_query(conn, "SELECT * FROM ".cfg["test_table"].";");

    while(row = mysql_fetch_array(r))
    {
        rows[] = row;
    }
}*/

void do_benchmark_inserts(int count) {
    int i = 0;

    for (i = 0; i < count; i++) {
        mysql_query(conn, cfg["insert_query"].c_str());
    }
}

void do_benchmark_reconnect(int count) {
    int i = 0;

    for (i = 0; i < count; i++) {
        mysql_close(conn);

        conn = mysql_init(NULL);
        if (!conn) {
            exit(1);
        }

        if (!mysql_real_connect(conn,
                                cfg["host"].c_str(),
                                cfg["user"].c_str(),
                                cfg["password"].length() ? cfg["password"].c_str() : NULL,
                                cfg["database"].c_str(),
                                0, NULL, 0)) {
            printf("Error %d: %s\n", mysql_errno(conn), mysql_error(conn));
            mysql_close(conn);
            exit(1);
        }
    }
}

void do_benchmark_escape_string(int count) {
    int i = 0;
    char *escaped_string;

    for (i = 0; i < count; i++) {
        escaped_string = new char[2*cfg["string_to_escape"].length() + 1];
        mysql_real_escape_string(conn, escaped_string, cfg["string_to_escape"].c_str(), cfg["string_to_escape"].length());
        delete[] escaped_string;
    }
}

void do_benchmark_initialization(int count) {
    conn = mysql_init(NULL);

    if (!conn) {
        exit(1);
    }

    if (!mysql_real_connect(conn,
                            cfg["host"].c_str(),
                            cfg["user"].c_str(),
                            cfg["password"].length() ? cfg["password"].c_str() : NULL,
                            cfg["database"].c_str(),
                            0, NULL, 0)) {
        printf("Error %d: %s\n", mysql_errno(conn), mysql_error(conn));
        mysql_close(conn);
        exit(1);
    }

    char drop_query[1024];
    sprintf(drop_query, "DROP TABLE IF EXISTS %s;", cfg["test_table"].c_str());
    mysql_query(conn, drop_query);
    mysql_query(conn, cfg["create_table_query"].c_str());
}

int main(int argc, char *argv[]) {
    int c = 0;
    opterr = 0;

    static struct option long_options[] = {
        {"host", required_argument, NULL, 0},
        {"user", required_argument, NULL, 0},
        {"password", optional_argument, NULL, 0},
        {"database", required_argument, NULL, 0},
        {"test_table", required_argument, NULL, 0},
        {"create_table_query", required_argument, NULL, 0},
        {"escape_count", required_argument, NULL, 0},
        {"string_to_escape", required_argument, NULL, 0},
        {"reconnect_count", required_argument, NULL, 0},
        {"insert_rows_count", required_argument, NULL, 0},
        {"insert_query", required_argument, NULL, 0},
        {"delay_before_select", required_argument, NULL, 0}
    };
    int option_index = 0;

    while ( (c = getopt_long(argc, argv, "", long_options, &option_index)) != -1 ) {
        switch (c) {
            case 0:
                if (optarg) {
                    cfg[long_options[option_index].name] = optarg;
                } else {
                    cfg[long_options[option_index].name] = "";
                }
                break;
            default:
                break;
        }
    }

    char title[128];
    int count = 0;

    // Initialize connection and database
    sprintf(title, "**** Benchmark initialization time is");
    count = 0;
    do_benchmark(do_benchmark_initialization, title, count);

    // Benchmark 1: Escapes
    sprintf(title, "**** %s escapes in", cfg["escape_count"].c_str());
    count = atoi(cfg["escape_count"].c_str());
    do_benchmark(do_benchmark_escape_string, title, count);

    // Benchmark 2: Reconnects
    sprintf(title, "**** %s sync reconnects in", cfg["reconnect_count"].c_str());
    count = atoi(cfg["reconnect_count"].c_str());
    do_benchmark(do_benchmark_reconnect, title, count);

    // Benchmark 3: inserts
    sprintf(title, "**** %s sync insertions in", cfg["insert_rows_count"].c_str());
    count = atoi(cfg["insert_rows_count"].c_str());
    do_benchmark(do_benchmark_inserts, title, count);

    sleep(atoi(cfg["delay_before_select"].c_str())/1000); // _micro_seconds

    // Benchmark 3: selects
    /*sprintf(title, "**** %s rows sync selected in", cfg["insert_rows_count"].c_str());
    count = atoi(cfg["insert_rows_count"].c_str());
    do_benchmark(do_benchmark_select, title, count);*/

    mysql_close(conn);
}

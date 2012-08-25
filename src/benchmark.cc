/**
 * Copyright (C) 2012, Oleg Efimov and other contributors
 *
 * See license text in LICENSE file
 */

#ifndef _GNU_SOURCE
# define _GNU_SOURCE
#endif
#include <getopt.h>

#include <mysql/mysql.h>

#include <map>
#include <vector>
#include <string>
#include <cstdio>
#include <cstdlib>
#include <ctime>

#include "current_utc_time.h"

MYSQL *conn;

std::map<std::string, std::string> cfg;

//
// Utility function for benchmarking
//

void do_benchmark(void (*f)(long int), const char *key, long int count)
{
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

        printf("\"%s\": %ld, ", key, operations);
    } else {
        printf("\"%s\": %.3Lf, ", key, delta);
    }
    fflush(stdout);
}

//
// Benchmarking functions
//

void do_benchmark_select(long int count) {
    MYSQL_RES* result;
    MYSQL_ROW row;
    MYSQL_FIELD *fields;
    unsigned int i, n_fields;
    std::vector<std::map<const char*, const char*> > rows;

    mysql_query(conn, cfg["select_query"].c_str());
    result = mysql_use_result(conn);
    n_fields = mysql_num_fields(result);
    fields = mysql_fetch_fields(result);

    while((row = mysql_fetch_row(result)))
    {
        std::map<const char*, const char*> map_fields;
        for (i = 0; i < n_fields; ++i)
        {
            map_fields[fields[i].name] = row[i];
        }
        rows.push_back(map_fields);
    }
    mysql_free_result(result);
}

void do_benchmark_inserts(long int count)
{
    long int i = 0;
    const char* query = cfg["insert_query"].c_str();

    for (i = 0; i < count; i++) {
        mysql_query(conn, query);
    }
}

void do_benchmark_reconnect(long int count)
{
    long int i = 0;

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
                                atoi(cfg["port"].c_str()), NULL, 0)
        ) {
            printf("Error %d: %s\n", mysql_errno(conn), mysql_error(conn));
            mysql_close(conn);
            exit(1);
        }
    }
}

void do_benchmark_escape_string(long int count)
{
    long int i = 0;
    char *escaped_string;
    const char *string_to_escape = cfg["string_to_escape"].c_str();
    const int string_to_escape_len = cfg["string_to_escape"].length();

    for (i = 0; i < count; i++) {
        escaped_string = new char[2*string_to_escape_len + 1];
        mysql_real_escape_string(conn, escaped_string, string_to_escape, string_to_escape_len);
        delete[] escaped_string;
    }
}

void do_benchmark_initialization(long int count) {
    conn = mysql_init(NULL);

    if (!conn) {
        exit(1);
    }

    if (!mysql_real_connect(conn,
                            cfg["host"].c_str(),
                            cfg["user"].c_str(),
                            cfg["password"].length() ? cfg["password"].c_str() : NULL,
                            cfg["database"].c_str(),
                            atoi(cfg["port"].c_str()), NULL, 0)
    ) {
        printf("Error %d: %s\n", mysql_errno(conn), mysql_error(conn));
        mysql_close(conn);
        exit(1);
    }

    char drop_query[128];
    sprintf(drop_query, "DROP TABLE IF EXISTS %s", cfg["test_table"].c_str());
    mysql_query(conn, drop_query);
    mysql_query(conn, cfg["create_table_query"].c_str());
}

int main(int argc, char *argv[])
{
    int c = 0;
    opterr = 0;

    static struct option long_options[] = {
        {"host", required_argument, NULL, 0},
        {"port", required_argument, NULL, 0},
        {"user", required_argument, NULL, 0},
        {"password", optional_argument, NULL, 0},
        {"database", required_argument, NULL, 0},
        {"test_table", required_argument, NULL, 0},
        {"create_table_query", required_argument, NULL, 0},
        {"select_query", required_argument, NULL, 0},
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

    long int count = 0;

    // Print JSON object open bracket
    printf("{");

    // Initialize connection and database
    count = 0;
    do_benchmark(do_benchmark_initialization, "init", count);

    // Benchmark 1: Escapes
    count = atol(cfg["escape_count"].c_str());
    do_benchmark(do_benchmark_escape_string, "escapes", count);

    // Benchmark 2: Reconnects
    count = atol(cfg["reconnect_count"].c_str());
    do_benchmark(do_benchmark_reconnect, "reconnects", count);

    // Benchmark 3: inserts
    count = atol(cfg["insert_rows_count"].c_str());
    do_benchmark(do_benchmark_inserts, "inserts", count);

    sleep(atoi(cfg["delay_before_select"].c_str())/1000); // _micro_seconds

    // Benchmark 3: selects
    count = atol(cfg["insert_rows_count"].c_str());
    do_benchmark(do_benchmark_select, "selects", count);

    // Print JSON object close bracket
    printf("\"0\": 0}");

    mysql_close(conn);

    return 0;
}

#!/usr/bin/env sh
g++ -O3 -o benchmark src/benchmark.cc -l:libmysqlclient.a -lssl -lrt -lz
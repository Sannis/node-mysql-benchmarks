#!/usr/bin/env sh
g++ -O2 -o benchmark src/benchmark.cc -l:libmysqlclient.a -lssl -lrt -lz
#!/usr/bin/env sh
g++ -O2 -std=c++0x -o benchmark src/benchmark.cc -l:libmysqlclient.a -lssl -lrt -lz -ldl -fPIC

#!/usr/bin/env sh

mkdir -p ./build

if [[ "$OSTYPE" =~ ^darwin ]]; then
  g++ -O2 -std=c++0x -stdlib=libc++ -o ./build/benchmark-cpp ./src/other/benchmark.cc -lmysqlclient -lssl      -lz -lc++
else
  g++ -O2 -std=c++0x                -o ./build/benchmark-cpp ./src/other/benchmark.cc -lmysqlclient -lssl -lrt -lz
fi

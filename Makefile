#!/bin/sh

all: build

rebuild: clean-all build

clean:
		rm -rf ./build
		rm -f build-stamp

clean-all: clean
		rm -f dependencies-stamp devdependencies-stamp

build: build-stamp dependencies

build-stamp: ./src/*
		touch build-stamp
		node-waf configure build

dependencies: dependencies-stamp

dependencies-stamp:
		touch dependencies-stamp
		npm install .

lint: devdependencies
		./node_modules/.bin/nodelint ./bin/*

benchmark: build
		./bin/node-mysql-bindings-benchmark.js

devdependencies: devdependencies-stamp

devdependencies-stamp:
		touch dependencies-stamp
		touch devdependencies-stamp
		npm install --dev .

.PHONY: all rebuild clean clean-all build lint benchmark


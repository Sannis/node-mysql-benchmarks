#!/bin/sh

all: clean build

clean:
		rm -rf ./build
		rm -f build-stamp

cleanall: clean
		rm -f devdependencies-stamp

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

devdependencies: devdependencies-stamp

devdependencies-stamp:
		touch dependencies-stamp
		touch devdependencies-stamp
		npm install --dev .

.PHONY: all clean cleanall build lint


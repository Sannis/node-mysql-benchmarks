#!/bin/sh
while true; do ps -o %cpu --no-headers $1 && $3/smem -c pss -H -p $1; sleep $2; done
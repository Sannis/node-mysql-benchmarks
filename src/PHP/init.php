#!/usr/bin/env php
<?php

include_once("_common.php");

function do_benchmark_init() {
  $start = microtime(true);

  do_init();

  $finish = microtime(true);

  return round($finish - $start, 3);
}

$results = array();

$results = do_benchmark_init();

mysql_close($conn);

echo json_encode($results);

#!/usr/bin/env php
<?php

include_once("_common.php");

function do_benchmark_inserts() {
  global $conn, $cfg;

  $start = microtime(true);

  for ($i = 0; $i < $cfg['insert_rows_count']; $i++)
    mysql_query($cfg['insert_query'], $conn);

  $finish = microtime(true);

  return round($cfg['insert_rows_count'] / ($finish - $start), 0);
}

do_init();

$results = array();

$results = do_benchmark_inserts();

mysql_close($conn);

echo json_encode($results);

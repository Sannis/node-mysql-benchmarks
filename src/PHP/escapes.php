#!/usr/bin/env php
<?php

include_once("_common.php");

function do_benchmark_escapes() {
  global $conn, $cfg;

  $escaped_string = "";

  $start = microtime(true);

  for ($i = 0; $i < $cfg['escape_count']; $i++)
    $escaped_string = mysql_real_escape_string($cfg['string_to_escape'], $conn);

  $finish = microtime(true);

  return round($cfg['escape_count']/($finish - $start), 0);
}

do_init(false);

$results = array();

$results = do_benchmark_escapes();

mysql_close($conn);

echo json_encode($results);

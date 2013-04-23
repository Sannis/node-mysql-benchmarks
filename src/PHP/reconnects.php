#!/usr/bin/env php
<?php

include_once("_common.php");

function do_benchmark_reconnects() {
  global $conn, $cfg;

  $start = microtime(true);

  for ($i = 0; $i < $cfg['reconnect_count']; $i++) {
    mysql_close($conn);
    $conn = mysql_connect("{$cfg['host']}:{$cfg['port']}", $cfg['user'], $cfg['password']);
    mysql_select_db($cfg['database'], $conn);
  }

  $finish = microtime(true);

  return round($cfg['reconnect_count']/($finish - $start), 0);
}

do_init(false);

$results = array();

$results = do_benchmark_reconnects();

mysql_close($conn);

echo json_encode($results);

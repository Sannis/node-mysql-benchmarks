#!/usr/bin/env php
<?php

include_once("_common.php");

function do_benchmark_selects() {
  global $conn, $cfg;

  $start = microtime(true);

  $rows = array();

  $r = mysql_query($cfg['select_query'], $conn);

  if ($cfg['use_array_rows']) {
    while ($row = mysql_fetch_row($r))
      $rows[] = $row;
  } else {
    while ($row = mysql_fetch_assoc($r))
      $rows[] = $row;
  }

  $finish = microtime(true);

  if (count($rows) != $cfg['insert_rows_count']) {
    file_put_contents('php://stderr', 'Got ' . count($rows) . ' rows, expected '
                                      . $cfg['insert_rows_count']);
    exit(1);
  }

  return round(count($rows) / ($finish - $start), 0);
}

do_init(false);

$results = array();

$results = do_benchmark_selects();

mysql_close($conn);

echo json_encode($results);

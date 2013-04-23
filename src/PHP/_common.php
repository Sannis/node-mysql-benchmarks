<?php
$conn = null;

$cfg = "";
$f = fopen('php://stdin', 'r');
while ($line = fgets($f))
  $cfg .= $line;
fclose($f);

$cfg = json_decode($cfg, true);

function do_init($clearTable=true) {
  global $conn, $cfg;

  $conn = mysql_connect("{$cfg['host']}:{$cfg['port']}", $cfg['user'], $cfg['password']);
  mysql_select_db($cfg['database'], $conn);

  if ($clearTable) {
    mysql_query("DROP TABLE IF EXISTS ".$cfg['test_table']);
    mysql_query($cfg['create_table_query']);
  }
}

?>
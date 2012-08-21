#!/usr/bin/env php
<?php
/**
 * Copyright (C) 2012, Oleg Efimov and other contributors
 *
 * See license text in LICENSE file
 */

$conn = null;

//
// Parse options
// A very basic pseudo --options parser
//

$cfg = array();
$m = false;
$next_option_key = false;

foreach ($argv as $option)
{
    if ($next_option_key)
    {
        $cfg[str_replace("-", "_", $next_option_key)] = $option;
        $next_option_key = false;
    }
    elseif (preg_match("/[-]{1,2}([^=]+)=(.+)/", $option, $m))
    {
        $cfg[str_replace("-", "_", $m[1])] = $m[2];
    }
    elseif (preg_match("/[-]{1,2}(.+)/", $option, $m))
    {
        $next_option_key = $m[1];
    }
}

//
// Benchmarking functions
//

function do_benchmark_selects()
{
    global $conn, $cfg;
    
    usleep(intval($cfg['delay_before_select'])*1000); // micro seconds
    
    $start = microtime(true);
    
    $rows = array();
    
    $r = mysql_query("SELECT * FROM ".$cfg['test_table'].";", $conn);
    
    while ($row = mysql_fetch_array($r)) {
        $rows[] = $row;
    }
    
    $finish = microtime(true);
    
    return round(count($rows)/($finish - $start), 0);
}

function do_benchmark_inserts()
{
    global $conn, $cfg;
    
    $start = microtime(true);
    
    for ($i = 0; $i < $cfg['insert_rows_count']; $i++) {
        mysql_query($cfg['insert_query'], $conn);
    }
    
    $finish = microtime(true);
    
    return round($cfg['insert_rows_count']/($finish - $start), 0);
}

function do_benchmark_reconnects()
{
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

function do_benchmark_escapes()
{
    global $conn, $cfg;
    
    $escaped_string = "";
    
    $start = microtime(true);

    for ($i = 0; $i < $cfg['escape_count']; $i++) {
        $escaped_string = mysql_real_escape_string($cfg['string_to_escape'], $conn);
    }
    
    $finish = microtime(true);
    
    return round($cfg['escape_count']/($finish - $start), 0);
}

function do_benchmark_init()
{
    global $conn, $cfg;
    
    $start = microtime(true);
    
    $conn = mysql_connect("{$cfg['host']}:{$cfg['port']}", $cfg['user'], $cfg['password']);
    mysql_select_db($cfg['database'], $conn);
    
    mysql_query("DROP TABLE IF EXISTS ".$cfg['test_table'].";");
    mysql_query($cfg['create_table_query']);
    
    $finish = microtime(true);
    
    return round($finish - $start, 3);
}

//
// Do benchmarks
//

$benchmarks = array(
    "init",
    "escapes",
    "reconnects",
    "inserts",
    "selects",
);

$results = array();

foreach ($benchmarks as $benchmark) {
    $results[$benchmark] = call_user_func("do_benchmark_" . $benchmark);
}

mysql_close($conn);

echo json_encode($results);

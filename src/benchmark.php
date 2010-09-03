#!/usr/bin/env php
<?php
/*
Copyright (C) 2010, Oleg Efimov <efimovov@gmail.com>

See license text in LICENSE file
*/

$conn;

//
// Parse options

$cfg = array();
$m = false;
$next_option_key = false;

// A very basic pseudo --options parser
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
// Utility function
//

function do_benchmark($execute_function, $title, $count = 0)
{
    $start = microtime(true);
    call_user_func($execute_function);
    $finish = microtime(true);
    
    $suffix = "";
    if( intval($count) > 0 )
    {
        $suffix = " (".round($count/($finish - $start), 0)."/s)";
    }
    
    print($title." ".round(($finish - $start), 2)."s".$suffix."\n");
}

//
// Benchmarking functions
//

function do_benchmark_select()
{
    global $conn, $cfg;
    
    $rows = array();
    
    $r = mysql_query("SELECT * FROM ".$cfg['test_table'].";", $conn);
    
    while($row = mysql_fetch_array($r))
    {
        $rows[] = $row;
    }
}

function do_benchmark_inserts()
{
    global $conn, $cfg;
    
    for( $i = 0; $i < $cfg['insert_rows_count']; $i++ )
    {
        mysql_query($cfg['insert_query'], $conn);
    }
}

function do_benchmark_reconnect()
{
    global $conn, $cfg;
    
    for( $i = 0; $i < $cfg['reconnect_count']; $i++ )
    {
        mysql_close($conn);
        $conn = mysql_connect($cfg['host'], $cfg['user'], $cfg['password']);
        mysql_select_db($cfg['database'], $conn);
    }

}

function do_benchmark_escape_string()
{
    global $conn, $cfg;
    
    $escaped_string = "";

    for( $i = 0; $i < $cfg['escape_count']; $i++ )
    {
        $escaped_string = mysql_real_escape_string($cfg['string_to_escape'], $conn);
    }
}

function do_benchmark_initialization()
{
    global $conn, $cfg;
    
    $conn = mysql_connect($cfg['host'], $cfg['user'], $cfg['password']);
    mysql_select_db($cfg['database'], $conn);
    
    mysql_query("DROP TABLE IF EXISTS ".$cfg['test_table'].";");
    mysql_query($cfg['create_table_query']);
}

// Initialize connection and database
do_benchmark("do_benchmark_initialization", "**** Benchmark initialization time is");

// Benchmark 1: Escapes
do_benchmark("do_benchmark_escape_string", "**** ".$cfg['escape_count']." escapes in", $cfg['escape_count']);

// Benchmark 2: Reconnects
do_benchmark("do_benchmark_reconnect", "**** ".$cfg['reconnect_count']." sync reconnects in", $cfg['reconnect_count']);

// Benchmark 3: inserts
do_benchmark("do_benchmark_inserts", "**** ".$cfg['insert_rows_count']." sync insertions in", $cfg['insert_rows_count']);

usleep(intval($cfg['delay_before_select'])*1000); // _micro_seconds

// Benchmark 3: selects
do_benchmark("do_benchmark_select", "**** ".$cfg['insert_rows_count']." rows sync selected in", $cfg['insert_rows_count']);

mysql_close($conn);


#!/usr/bin/env php
<?php
/*
Copyright (C) 2010, Oleg Efimov <efimovov@gmail.com>

See license text in LICENSE file
*/

//
// Config
//

$host = "localhost";
$user = "test";
$password = "";
$database = "test";
$test_table = "test_table";

$escapes_count = 1000000;
$reconnects_count = 10000;
$inserts_count = 100000;

$delay_before_select = 1*1000;

$string_to_escape = "str\\str\str\str\"str\'str\x00str";

$conn;

//
// Utility function
//

function do_benchmark($execute_function, $title, $count)
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
    global $conn, $test_table;
    
    $rows = array();
    
    mysql_query("SELECT * FROM ".$test_table.";", $conn);
    
    while($row = mysql_fetch_array())
    {
        $rows[] = $row;
    }
}

function do_benchmark_inserts($rows)
{
    global $conn, $test_table, $inserts_count;
    
    for( $i = 0; $i < $inserts_count; $i++ )
    {
        mysql_query("INSERT INTO ".$test_table." VALUES (1, 'hello', 3.141);", $conn);
    }
}

function do_benchmark_reconnect()
{
    global $conn, $host, $user, $password, $database, $reconnects_count;
    
    for( $i = 0; $i < $reconnects_count; $i++ )
    {
        mysql_close($conn);
        $conn = mysql_connect($host, $user, $password);
        mysql_select_db($database, $conn);
    }

}

function do_benchmark_escape_string()
{
    global $conn, $string_to_escape, $escapes_count;
    
    $escaped_string = "";

    for( $i = 0; $i < $escapes_count; $i++ )
    {
        $escaped_string = mysql_real_escape_string($string_to_escape, $conn);
    }
}

function do_benchmark_initialization()
{
    global $conn, $host, $user, $password, $database, $test_table;
    
	$conn = mysql_connect($host, $user, $password);
	mysql_select_db($database, $conn);
    
	mysql_query("DROP TABLE IF EXISTS ".$test_table.";");
	mysql_query("SET max_heap_table_size=128M;");
	mysql_query("CREATE TABLE ".$test_table.
				" (alpha INTEGER, beta VARCHAR(128), pi FLOAT) ".
				"TYPE=MEMORY;");
}


// Initialize connection and database
do_benchmark("do_benchmark_initialization", "**** Benchmark initialization time is");

// Benchmark 1: Escapes
do_benchmark("do_benchmark_escape_string", "**** ".$escapes_count." escapes in", $escapes_count);

// Benchmark 2: Reconnects
do_benchmark("do_benchmark_reconnect", "**** ".$reconnects_count." sync reconnects in", $reconnects_count);

// Benchmark 3: inserts
do_benchmark("do_benchmark_inserts", "**** ".$inserts_count." sync insertions in", $inserts_count);

usleep($delay_before_select);

// Benchmark 3: selects
do_benchmark("do_benchmark_select", "**** ".$inserts_count." rows sync selected in", $inserts_count);

mysql_close($conn);


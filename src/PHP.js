/**
 * Copyright (C) 2012, Oleg Efimov and other contributors
 *
 * See license text in LICENSE file
 */

"use strict";

exports.run = function (callback, cfg) {
  require('./helper').spawnBenchmark('src/other/benchmark.php', null, callback, cfg);
};

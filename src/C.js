/**
 * Copyright (C) 2012, Oleg Efimov and other contributors
 *
 * See license text in LICENSE file
 */

"use strict";

exports.run = function (callback, cfg) {
  var args = [], key;

  for (key in cfg) {
    if (cfg.hasOwnProperty(key)) {
      args.push('--' + key);
      
      if (typeof cfg[key] === 'boolean') {
        args.push(cfg[key] ? '1' : '0');
      } else if (typeof cfg[key] !== 'object') {
        args.push(cfg[key]);
      }
    }
  }

  require('./helper').spawnBenchmark(__dirname + '/../build/benchmark-cpp', args, callback, cfg);
};

Benchmarks for MySQL bindings for Node.js
=========================================

GitHub repo: http://github.com/Sannis/node-mysql-bindings-benchmarks

Before execute run-benchmarks.js you should prepare dependencies
and build binary bindings:

$ git submodule init
$ node-waf configure build

Tested with Node version v0.2.5

== Supported MySQL bindings

[+] https://github.com/Sannis/node-mysql-libmysqlclient
[+] https://github.com/felixge/node-mysql
[-] https://github.com/stevebest/node-mysql
[+] https://github.com/sidorares/nodejs-mysql-native
[+] https://github.com/mariano/node-db-mysql

Also included benchmarks written in PHP and C++.

== Benchmark results

Some of my (Sannis') benchmark results:
<https://github.com/Sannis/node-mysql-bindings-benchmarks/wiki>.

== Node.js

Node is the evented I/O for V8 javascript.
Node's goal is to provide an easy way to build scalable network programs,
it is similar in design to and influenced by systems like Ruby's Event Machine or Python's Twisted.
Website: http://nodejs.org

== Contributing

To contribute any patches, simply fork this repository using GitHub
and send a pull request to me (http://github.com/Sannis). Thanks!

== License & Contributors

MIT License. See license text in file LICENSE.

Bindings licenses you can read in their deps/* dir.
At this moment all of them are MIT-licensed.

* Oleg Efimov
  E-mail: <efimovov@gmail.com>
  GitHub: http://github.com/Sannis
  Site: http://sannis.ru


import Options, Utils
from os import unlink, symlink, chdir
from os.path import exists

srcdir = "."
blddir = "build"
VERSION = "0.0.1"

def set_options(opt):
  opt.recurse("deps/node-mysql-libmysqlclient")

def configure(conf):
  print("Configure node-mysql-libmysqlclient")
  conf.recurse("deps/node-mysql-libmysqlclient")

def build(bld):
  print("Build node-mysql-libmysqlclient")
  bld.recurse("deps/node-mysql-libmysqlclient")

def test(tst):
  print("Run tests for node-mysql-libmysqlclient")
  tst.recurse("deps/node-mysql-libmysqlclient")

def load_deps(ctx):
  Utils.exec_command('git submodule update --init')

def shutdown():
    t = "mysql_bindings.node"
    if exists("build/default/deps/node-mysql-libmysqlclient/" + t) and not exists("deps/node-mysql-libmysqlclient/" + t):
      symlink("../../build/default/deps/node-mysql-libmysqlclient/" + t, "deps/node-mysql-libmysqlclient/" + t)


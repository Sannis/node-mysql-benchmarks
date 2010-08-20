import Options, Utils
from os import unlink, symlink, chdir
from os.path import exists

srcdir = "."
blddir = "build"
VERSION = "0.0.1"

def set_options(opt):
  opt.recurse("deps/Sannis-node-mysql-libmysqlclient")

def configure(conf):
  print("Configure Sannis/node-mysql-libmysqlclient")
  conf.recurse("deps/Sannis-node-mysql-libmysqlclient")

def build(bld):
  print("Build Sannis/node-mysql-libmysqlclient")
  bld.recurse("deps/Sannis-node-mysql-libmysqlclient")

def test(tst):
  print("Run tests for Sannis/node-mysql-libmysqlclient")
  tst.recurse("deps/Sannis-node-mysql-libmysqlclient")

def load_deps(ctx):
  Utils.exec_command('git submodule update --init')

def shutdown():
    t = "mysql_bindings.node"
    if exists("build/default/deps/Sannis-node-mysql-libmysqlclient/" + t) and not exists("deps/Sannis-node-mysql-libmysqlclient/" + t):
      symlink("../../build/default/deps/Sannis-node-mysql-libmysqlclient/" + t, "deps/Sannis-node-mysql-libmysqlclient/" + t)


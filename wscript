import Options, Utils
from os import unlink, symlink, chdir
from os.path import exists

srcdir = "."
blddir = "build"
VERSION = "0.0.1"

def set_options(opt):
  opt.recurse("deps/Sannis-node-mysql-libmysqlclient")
  
  opt.tool_options('compiler_cc')
  opt.add_option('--mysql-config', action='store', default='mysql_config', help='Path to mysql_config, e.g. /usr/bin/mysql_config')

def configure(conf):
  print("Configure Sannis/node-mysql-libmysqlclient")
  conf.recurse("deps/Sannis-node-mysql-libmysqlclient")
  
  print("Configure C++ benchmark")
  conf.check_tool('compiler_cxx')
  conf.env.append_unique('CXXFLAGS', ["-g", "-D_FILE_OFFSET_BITS=64","-D_LARGEFILE_SOURCE", "-Wall"])
  
  conf.env.append_unique('CXXFLAGS', Utils.cmd_output(Options.options.mysql_config + ' --include').split())
  
  if conf.check_cxx(lib="mysqlclient_r", errmsg="not found, try to find nonthreadsafe libmysqlclient"):
    conf.env.append_unique('LINKFLAGS', Utils.cmd_output(Options.options.mysql_config + ' --libs_r').split())
  else:
    if conf.check_cxx(lib="mysqlclient"):
      conf.env.append_unique('LINKFLAGS', Utils.cmd_output(Options.options.mysql_config + ' --libs').split())
    else:
      conf.fatal("Missing both libmysqlclient_r and libmysqlclient from libmysqlclient-devel or mysql-devel package")
  
  if not conf.check_cxx(header_name='mysql.h'):
    conf.fatal("Missing mysql.h header from libmysqlclient-devel or mysql-devel package")

def build(bld):
  print("Build Sannis/node-mysql-libmysqlclient")
  bld.recurse("deps/Sannis-node-mysql-libmysqlclient")
  
  print("Build C++ benchmark")
  obj = bld.new_task_gen("cxx", "cprogram")
  obj.target = "benchmark"
  obj.source = "./src/benchmark.cc"
  obj.uselib = "MYSQLCLIENT"

def test(tst):
  print("Run tests for Sannis/node-mysql-libmysqlclient")
  tst.recurse("deps/Sannis-node-mysql-libmysqlclient")

def load_deps(ctx):
  Utils.exec_command('git submodule update --init')

def shutdown():
    t = "mysql_bindings.node"
    if exists("build/default/deps/Sannis-node-mysql-libmysqlclient/" + t) and not exists("deps/Sannis-node-mysql-libmysqlclient/" + t):
      symlink("../../build/default/deps/Sannis-node-mysql-libmysqlclient/" + t, "deps/Sannis-node-mysql-libmysqlclient/" + t)


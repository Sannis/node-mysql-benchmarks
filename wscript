import Options, Utils
from os import unlink, symlink, chdir
from os.path import exists

srcdir = "."
blddir = "build"
VERSION = "0.2.1"

def set_options(opt):
  opt.tool_options('compiler_cxx')
  opt.add_option('--mysql-config', action='store', default='mysql_config', help='Path to mysql_config, e.g. /usr/bin/mysql_config')

def configure(conf):
  conf.check_tool('compiler_cxx')
  conf.env.append_unique('CXXFLAGS', ["-Wall"])

  # MySQL headers
  conf.env.append_unique('CXXFLAGS', Utils.cmd_output(Options.options.mysql_config + ' --include').split())

  if not conf.check_cxx(header_name='mysql.h'):
    conf.fatal("Missing mysql.h header from libmysqlclient-devel or mysql-devel package")

  # MySQL libraries
  conf.env.append_unique('LINKFLAGS', Utils.cmd_output(Options.options.mysql_config + ' --libs_r').split())

  if not conf.check_cxx(lib="mysqlclient_r", errmsg="not found"):
    conf.fatal("Missing thread-safe libmysqlclient_r library from libmysqlclient-devel or mysql-devel package")

def build(bld):
  print("Build C++ benchmark")
  obj = bld.new_task_gen("cxx", "cprogram")
  obj.target = "benchmark"
  obj.source = "./src/benchmark.cc"
  obj.uselib = "MYSQLCLIENT"


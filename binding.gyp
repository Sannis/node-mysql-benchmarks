{
  'targets': [
    {
      'target_name': 'benchmark',
      'sources': [
        'src/benchmark.cc',
      ],
      'conditions': [
        [ 'OS!="win"', {
          'cflags': [ '-O3' ],
          'libraries': [
            '-l:libmysqlclient_r.a',
          ],
        }],
      ]
    },
  ],
}

require('babel-core/register')({
  'presets': [
    'stage-3',
    ["latest-node", { "target": "current" }]
  ],
  'plugins': [
    'transform-class-properties'
  ]
})

require('babel-polyfill')
require('./index')

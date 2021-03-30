import jil from 'jil'
let matcher = require('../../../tools/jil/util/browser-matcher')
let supported = matcher.withFeature('wrappableAddEventListener')

jil.browserTest('callback timing', supported, function (t) {
  let helpers = require('./helpers.es6')
  let validator = new helpers.InteractionValidator({
    name: 'interaction',
    jsTime: 100,
    children: [{
      type: 'customTracer',
      attrs: {
        name: 'timer'
      },
      jsTime: 300,
      children: []
    }]
  })

  t.plan(2 + validator.count)

  helpers.startInteraction(onInteractionStart, afterInteractionDone)

  function onInteractionStart (cb) {
    setTimeout(() => newrelic.interaction().createTracer('timer', () => {
      blockFor(300)
      cb()
    })(), 200)

    blockFor(100)
  }

  function afterInteractionDone (interaction) {
    t.ok(interaction.root.end, 'interaction should be finished and have an end time')
    t.notok(helpers.currentNodeId(), 'interaction should be null outside of async chain')
    validator.validate(t, interaction)
    t.end()
  }
})

jil.browserTest('callback timing multiple callbacks', supported, function (t) {
  let helpers = require('./helpers.es6')
  let validator = new helpers.InteractionValidator({
    name: 'interaction',
    jsTime: 100,
    children: [{
      name: 'ajax',
      jsTime: 400,
      children: []
    }]
  })

  t.plan(2 + validator.count)

  helpers.startInteraction(onInteractionStart, afterInteractionDone)

  function onInteractionStart (cb) {
    var xhr = new XMLHttpRequest()

    xhr.addEventListener('load', function () {
      blockFor(100)
    })

    xhr.addEventListener('load', function () {
      blockFor(300)
      cb()
    })

    xhr.open('GET', '/')
    xhr.send()
    blockFor(100)
  }

  function afterInteractionDone (interaction) {
    t.ok(interaction.root.end, 'interaction should be finished and have an end time')
    t.notok(helpers.currentNodeId(), 'interaction should be null outside of async chain')
    validator.validate(t, interaction)
    t.end()
  }
})

jil.browserTest('callback timing microtasks', supported, function (t) {
  // can't use multiple matchers in same file
  if (!window.Promise) {
    t.end()
    return
  }

  let helpers = require('./helpers.es6')
  let validator = new helpers.InteractionValidator({
    name: 'interaction',
    jsTime: 400,
    children: []
  })

  t.plan(2 + validator.count)

  helpers.startInteraction(onInteractionStart, afterInteractionDone)

  function onInteractionStart (cb) {
    Promise.resolve().then(function () {
      blockFor(300)
      cb()
    })

    blockFor(100)
  }

  function afterInteractionDone (interaction) {
    t.ok(interaction.root.end, 'interaction should be finished and have an end time')
    t.notok(helpers.currentNodeId(), 'interaction should be null outside of async chain')
    validator.validate(t, interaction)
    t.end()
  }
})

function blockFor (ms) {
  let helpers = require('./helpers.es6')
  var start = helpers.now()
  var data = 0
  while (helpers.now() - start <= ms) data ^= start
  return data
}

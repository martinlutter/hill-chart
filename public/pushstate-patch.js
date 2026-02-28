/**
 * Patches history.pushState and history.replaceState in the MAIN world so that
 * each call dispatches a 'hill:urlchange' event on window.
 *
 * This file lives in public/ so Vite copies it as-is — no bundler loader wrapping.
 * It is injected into the page by navigation.ts via a <script> tag, which runs
 * in the MAIN world and can intercept the page's own pushState/replaceState calls.
 */
;(function () {
  var EVENT_NAME = 'hill:urlchange'
  var methods = ['pushState', 'replaceState']
  for (var i = 0; i < methods.length; i++) {
    var method = methods[i]
    var original = history[method]
    history[method] = function () {
      var result = original.apply(history, arguments)
      window.dispatchEvent(new Event(EVENT_NAME))
      return result
    }
  }
  window.__hillPushstatePatched = true
})()

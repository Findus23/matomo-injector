(function() {
  function injectScript(src, where) {
    var elm = document.createElement('script');
    elm.src = src;
    document[where || 'head'].appendChild(elm);
  }

  function generateScriptDataUrl(script) {
    var b64 = 'data:text/javascript';
    // base64 may be smaller, but does not handle unicode characters
    // attempt base64 first, fall back to escaped text
    try {
      b64 += (';base64,' + btoa(script));
    }
    catch (e) {
      b64 += (';charset=utf-8,' + encodeURIComponent(script));
    }
    return b64;
  }


  var website = location.protocol + '//' + location.host;
  chrome.storage.sync.get(website, function(obj) {
    var customjs = obj[website];
    if (customjs && customjs.config.enable) {
      // Script
      if (customjs.source) {
        setTimeout(function() {
          injectScript(generateScriptDataUrl(customjs.source), 'body');
        }, 250);
      }
    }
  });
})();

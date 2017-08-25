(function() {
  function injectScript(src, where) {
    var elm = document.createElement('script');
    elm.src = src;
    document[where || 'head'].appendChild(elm);
  }

  var website = location.protocol + '//' + location.host;
  chrome.storage.sync.get(website, function(obj) {
    var customjs = obj[website];
    if (customjs) {
      if (customjs.config.enable && customjs.source) {
        setTimeout(function() {
          injectScript(customjs.source, 'body');
        }, 250);

      }
    }
  });
})();

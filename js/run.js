(function() {
  function injectScript(src, where) {
    var elm = document.createElement('script');
    elm.src = src;
    document[where || 'head'].appendChild(elm);
  }

  var website = location.protocol + '//' + location.host;
  chrome.storage.sync.get(website, function(obj) {
    var customjs = obj[website];
    if( customjs ) {
      if( customjs.config.enable ) {
        // Predefined include
        if( customjs.config.include ) {
          injectScript('https://ajax.googleapis.com/ajax/libs' + customjs.config.include);
        }

        // Extra include
        var extra = (customjs.config.extra || '').split(';');
        extra.forEach(function(line) {
          if( line.substr(0, 1) !== '#' ) {
            injectScript(line);
          }
        });

        // Script
        if( customjs.source ) {
          setTimeout(function() {
            injectScript(customjs.source, 'body');
          }, 250);
        }
      }
    }
  });
})();

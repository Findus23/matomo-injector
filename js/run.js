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

  function addEnabledBadge() {
    var parser = new DOMParser();
    var warningSVGString = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 550 550"><path fill="#ff7900" d="M275 30.8c-15.7 0-30.2 8.4-38 22L5.6 453.3c-4 6.8-6 14.4-6 22 0 7.5 2 15 6 22 7.8 13.5 22.4 22 38 22h462.5c15.7 0 30.3-8.5 38-22 4-7 6-14.5 6-22 0-7.6-2-15.2-6-22l-231-400.5c-8-13.6-22.5-22-38.2-22zm0 149.4c16.6 0 27.3 12 27 22.6-.3 8.4-1.2 36.7-3 55.3l-8 89.7c-1.2 11-3 19-5.4 24-2.2 4.8-5.7 7.3-10.6 7.8-5-.5-8.4-3-10.6-7.7-2.4-5.2-4.2-13.2-5.5-24l-8-89.7c-1.8-18.5-2.7-46.8-3-55.2-.4-11.6 10.4-22.6 27-22.6zm0 211.3a26.6 26.6 0 0 1 26.6 26.6A26.6 26.6 0 0 1 275 445a26.6 26.6 0 0 1-26.6-26.7 26.6 26.6 0 0 1 26.6-26.5z"/></svg>';
    var svg = parser.parseFromString(warningSVGString, "image/svg+xml").children[0];
    var div = document.createElement("div");
    var title = document.createElement("div");

    Object.assign(div.style, {
      all: "unset",
      position: "absolute",
      top: 20 + "px",
      right: 20 + "px",
      zIndex: 100000
    });

    Object.assign(svg.style, {
      all: "unset",
      width: 20 + "px",
      height: 20 + "px",
      display: "block",
      marginLeft: "auto",
      marginRight: 0,
      marginBottom: 10 + "px"
    });

    Object.assign(title.style, {
      all: "unset",
      display: "none",
      background: "white",
      padding: 5 + "px"
    });

    title.innerText = chrome.i18n.getMessage("enabled_badge_title");
    div.appendChild(svg);
    div.appendChild(title);
    div.addEventListener("mouseover", function() {
      title.style.display = "block";
    });
    div.addEventListener("mouseout", function() {
      title.style.display = "none";
    });
    document.body.appendChild(div);
  }


  var website = location.protocol + '//' + location.host;
  chrome.storage.sync.get(website, function(obj) {
    var customjs = obj[website];
    if (customjs && customjs.config.enable) {
      console.error(customjs);
      // Script
      if (customjs.source) {
        setTimeout(function() {
          addEnabledBadge();
          injectScript(generateScriptDataUrl(customjs.source), 'body');
        }, 250);
      }
    }
  });
  chrome.storage.sync.get("global", function(items) {
    if (items && Object.keys(items).length !== 0) {
      var global = items.global;
      if (global.enabled) {
        setTimeout(function() {
          addEnabledBadge();
          injectScript(generateScriptDataUrl(global.js), 'body');
        }, 250);
      }
    }
  });
})();

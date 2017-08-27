document.addEventListener('DOMContentLoaded', function() {

  var popup = {
    key: 'popup',
    el: {
      popup: document.getElementById("customjs"),
      hostSelect: document.getElementById("host"),
      hostGoToLink: document.getElementById("goto-host"),
      enableCheck: document.getElementById("enable"),
      sourceEditor: document.getElementById("ace-editor"),
      saveBtn: document.getElementById("save"),
      resetBtn: document.getElementById("reset"),
      draftRemoveLink: document.getElementById("draft-remove"),
      error: document.getElementById("error"),
      piwikForm: document.getElementById("piwik-form"),
      piwikURL: document.getElementById("piwik-url"),
      siteID: document.getElementById("site-id"),
      expertMode: document.getElementById("expert-mode")
    },
    applyi18n: function() {
      var translatableIDs = ["error-message", "error-tip", "save", "reset", "goto-host", "enable-description", "host-label", "expert-mode-label", "draft-remove"];
      translatableIDs.forEach(function(id) {
        var translateKey = id.replace(/-/g, "_");
        document.getElementById(id).innerText = chrome.i18n.getMessage(translateKey);
      });
      var translatableTitles = ["host", "goto_host", "save", "reset", "draft_remove", "piwik_url", "site_id"];
      translatableIDs.forEach(function(id) {
        var translateKey = id.replace("-", "_") + "_title";
        document.getElementById(id).setAttribute('title', chrome.i18n.getMessage(translateKey));
      });
      popup.el.piwikURL.setAttribute("placeholder", chrome.i18n.getMessage("piwik_url_placeholder"));
      popup.el.siteID.setAttribute("placeholder", chrome.i18n.getMessage("site_id_placeholder"));
      document.title = chrome.i18n.getMessage("extention_name")
    },
    host: undefined,
    url: undefined,
    emptyDataPattern: {
      config: {
        enable: false
      },
      source: ''
    },
    data: null,
    editor: {
      editorInstance: null,
      defaultValue: chrome.i18n.getMessage("placeholder_javascript"),
      value: '',
      init: function() {
        var editor = this.editorInstance = ace.edit(popup.el.sourceEditor);
        editor.setTheme("ace/theme/tomorrow");
        editor.getSession().setMode("ace/mode/javascript");
        // editor.setHighlightActiveLine(false);
        editor.getSession().on('change', this.onChange);
        editor.$blockScrolling = Infinity;
        editor.setReadOnly(true)
      },
      apply: function(source) {
        var editor = this.editorInstance;
        editor.setValue(source);
        editor.gotoLine(1);
      }
    },
    storage: {
      data: {
        private: {},
        global: {}
      },
      MODE: {
        private: 1,
        global: 2
      },
      setMode: function(mode) {
        if (mode === this.MODE.private) {
          this.key = popup.key + "-" + popup.protocol + "//" + popup.host;
          this.mode = this.MODE.private;
        }

        if (mode === this.MODE.global) {
          this.key = popup.key;
          this.mode = this.MODE.global;
        }
      },
      load: function() {
        this.setMode(this.MODE.private);
        this._setData(JSON.parse(localStorage.getItem(this.key) || "{}"));

        this.setMode(this.MODE.global);
        this._setData(JSON.parse(localStorage.getItem(this.key) || "{}"));
      },
      _getData: function(key) {
        var storage = popup.storage;
        if (storage.mode === storage.MODE.private) {
          if (key) {
            return storage.data.private[key];
          }
          else {
            return storage.data.private;
          }
        }
        if (storage.mode === storage.MODE.global) {
          if (key) {
            return storage.data.global[key];
          }
          else {
            return storage.data.global;
          }
        }
      },
      _setData: function(data, key) {
        var storage = popup.storage;
        if (storage.mode === storage.MODE.private) {
          if (key) {
            storage.data.private[key] = data;
          }
          else {
            storage.data.private = data;
          }
        }
        if (storage.mode === storage.MODE.global) {
          if (key) {
            storage.data.global[key] = data;
          }
          else {
            storage.data.global = data;
          }
        }
      },
      get: function(key) {
        return this._getData(key);
      },
      set: function(arg1, arg2) {
        // arg1 is a key
        if (typeof arg1 === 'string') {
          this._setData(arg2, arg1);
        }
        // arg1 is data
        else {
          this._setData(arg1);
        }

        var str = JSON.stringify(this._getData() || {});
        localStorage.setItem(this.key, str);
      },
      remove: function(key) {
        if (key) {
          var data = this._getData();
          delete data[key];

          if (Object.keys(data).length === 0) {
            this.remove();
          }
          else {
            var str = JSON.stringify(this._getData());
            localStorage.setItem(this.key, str);
          }
        }
        else {
          localStorage.removeItem(this.key);
          this._setData({});
        }
      }
    },
    apiclb: {
      onSelectedTab: function(tabs) {
        popup.tabId = tabs[0].id;
        chrome.tabs.sendMessage(popup.tabId, {method: "getData", reload: false}, popup.apiclb.onGetData);
      },
      onGetData: function(response) {
        // console.warn(response);
        // console.info(chrome.runtime.lastError);
        if (!response || typeof response.host !== 'string') {
          popup.error();
          return;
        }

        /**
         * Create 'hosts select'
         */

        popup.host = response.host;
        popup.protocol = response.protocol;
        popup.url = popup.protocol + "//" + popup.host;

        chrome.storage.sync.get("hosts", function(items) {
              var hosts = items.hosts;
              if (!hosts) {
                hosts = [];
              }
              // Add current host to list
              if (hosts.indexOf(popup.url) === -1) {
                hosts.push(popup.url);
              }
              // Fill 'hosts select'
              hosts.forEach(function(host) {
                var option = document.createElement('option');
                option.innerText = host;
                if (host === popup.url) {
                  option.setAttribute('selected', 'selected');
                }
                popup.el.hostSelect.appendChild(option);
              });

              // Store host (current included in array) if customjs is defined
              if (response.customjs) {
                chrome.storage.sync.set({"hosts": hosts});
              }
            }
        );
        /**
         * Set-up data (script, enable, include, extra)
         */

        // Set-up data pattern if empty
        if (!popup.data) {
          popup.data = Object.assign(true, {}, popup.emptyDataPattern);
        }

        // Merge host's data to defaults
        popup.data = Object.assign(popup.data, response.customjs);

        // ... source is now encoded as base64
        if (popup.data.source.indexOf('data:text/javascript;base64,') === 0) {
          popup.data.source = popup.data.source.replace('data:text/javascript;base64,', '');
          popup.data.source = atob(popup.data.source);
        }
        else if (popup.data.source.indexOf('data:text/javascript;charset=utf-8,') === 0) {
          popup.data.source = popup.data.source.replace('data:text/javascript;charset=utf-8,', '');
          popup.data.source = decodeURIComponent(popup.data.source);
        }

        // Apply data (draft if exist)
        chrome.storage.local.get(popup.url, function(items) {
          var text;
          if (items && Object.keys(items).length !== 0) { // if draft exists
            text = items[popup.url].draft;
          }
          popup.applyData(text);
        });
      }
    },

    piwik: {
      defaultTrackingCode: "var _paq = _paq || [];\n" +
      "/* tracker methods like \"setCustomDimension\" should be called before \"trackPageView\" */\n" +
      "_paq.push(['trackPageView']);\n" +
      "_paq.push(['enableLinkTracking']);\n" +
      "(function() {\n" +
      "  var u=\"{{PIWIKURL}}\";\n" +
      "  _paq.push(['setTrackerUrl', u+'piwik.php']);\n" +
      "  _paq.push(['setSiteId', '{{SITEID}}']);\n" +
      "  var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];\n" +
      "  g.type='text/javascript'; g.async=true; g.defer=true; g.src=u+'piwik.js'; s.parentNode.insertBefore(g,s);\n" +
      "})();",
      handleTrackingCode: function() {
        var piwikURL = encodeURI(popup.el.piwikURL.value);
        var siteID = parseInt(popup.el.siteID.value, 10);
        if (!siteID || !piwikURL) {
          return false;
        }
        var js = popup.piwik.defaultTrackingCode;
        js = js.replace("{{PIWIKURL}}", piwikURL);
        js = js.replace("{{SITEID}}", String(siteID));
        popup.editor.apply(js);
        chrome.storage.sync.set({"piwik": {piwikURL: piwikURL, siteID: siteID}});
      },
      setExpertMode: function(expertMode, onLoad) {
        popup.editor.editorInstance.setOptions({
          readOnly: !expertMode,
          highlightActiveLine: expertMode,
          highlightGutterLine: expertMode
        });
        popup.editor.editorInstance.container.style.backgroundColor = expertMode ? "white" : "#eaeded";
        popup.el.piwikForm.querySelectorAll("input").forEach(function(input) {
          input.disabled = expertMode;
        });
        popup.el.expertMode.checked = expertMode;
        if (!onLoad) {
          chrome.storage.sync.set({"expertMode": expertMode});
        }
      },
      loadExpertMode: function() {
        chrome.storage.sync.get("expertMode", function(items) {
          popup.piwik.setExpertMode(items.expertMode);
        });
      }
    },
    generateScriptDataUrl: function(script) {
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
    },
    decodeDataUrl: function(dataUrl) {
      if (dataUrl.indexOf('data:text/javascript;base64,') === 0) {
        dataUrl = dataUrl.replace('data:text/javascript;base64,', '');
        return atob(dataUrl);
      }
      else if (dataUrl.indexOf('data:text/javascript;charset=utf-8,') === 0) {
        dataUrl = dataUrl.replace('data:text/javascript;charset=utf-8,', '');
        return decodeURIComponent(dataUrl);
      } else {
        return dataUrl
      }
    },
    applyData: function(data, notDraft) {

      if (data && !notDraft) {
        this.el.draftRemoveLink.classList.remove('is-hidden');
      }

      data = data || this.data;
      // Default value for source

      data.source = popup.decodeDataUrl(data.source);
      console.info(data);
      if (!data.source) {
        data.source = popup.editor.defaultValue;
      }

      // Set enable checkbox
      popup.el.enableCheck.checked = data.config.enable;

      // Apply source into editor
      popup.editor.apply(data.source);
    },
    getCurrentData: function() {
      return {
        config: {
          enable: popup.el.enableCheck.checked
        },
        source: popup.editor.editorInstance.getValue()
      };
    },
    removeDraft: function() {
      chrome.storage.local.remove(popup.url);
      popup.applyData();
      popup.el.draftRemoveLink.classList.add('is-hidden');
    },
    save: function(e) {
      e.preventDefault();

      // Is allowed to save?
      if (popup.el.saveBtn.classList.contains('pure-button-disabled')) {
        return false;
      }

      var data = popup.getCurrentData();

      // Transform source for correct apply
      data.source = popup.generateScriptDataUrl(data.source);

      // Send new data to apply
      // chrome.tabs.sendMessage(popup.tabId, {method: "setData", customjs: data, reload: true});

      var syncdata = {};
      syncdata[popup.url] = data;
      chrome.storage.sync.set(syncdata);

      // Clear draft
      popup.removeDraft();

      // Close popup
      window.close();

      return false;
    },
    reset: function(e) {
      e.preventDefault();

      // Is allowed to reset?
      if (popup.el.resetBtn.classList.contains('pure-button-disabled')) {
        return false;
      }

      if (confirm(chrome.i18n.getMessage("delete_warning"))) {
        // Remove stored data for current host
        popup.storage.setMode(popup.storage.MODE.private);
        popup.storage.remove();

        // Remove host from hosts inside global storage
        popup.storage.setMode(popup.storage.MODE.global);

        chrome.storage.sync.get("hosts", function(items) {
              var hosts = items.hosts;
              var index = hosts.indexOf(popup.url);
              if (index > -1) {
                hosts.splice(index, 1);
              }
              chrome.storage.sync.set({"hosts": hosts});
            }
        );

        // Remove customjs from frontend
        chrome.tabs.sendMessage(popup.tabId, {method: "removeData", reload: false});

        // Set-up empty data
        popup.data = Object.assign(true, {}, popup.emptyDataPattern);
        popup.applyData();

        popup.removeDraft();
      }

      return false;
    },
    error: function() {
      popup.el.popup.classList.add('customjs--error');
      popup.el.error.classList.remove('is-hidden');
    }
  };

  window.popup = popup;

  /**
   * Add titles to elements
   */

  popup.applyi18n();


  /**
   * Click to goTo host link
   */
  popup.el.hostGoToLink.addEventListener('click', function() {
    var link = popup.el.hostSelect.value;
    chrome.tabs.sendMessage(popup.tabId, {method: "goTo", link: link, reload: false});
    window.close();
  });


  /**
   * Inicialize Ace Editor
   */

  popup.editor.init();


  /**
   * Connect front end (load info about current site)
   */

  chrome.tabs.query({
    active: true,
    lastFocusedWindow: true
  }, popup.apiclb.onSelectedTab);


  popup.el.piwikForm.querySelectorAll("input").forEach(function(input) {
    input.addEventListener("change", popup.piwik.handleTrackingCode)
  });

  /**
   * Auto save draft
   */

  var draftAutoSave = function() {
        var draft = popup.getCurrentData(),
            source = draft.source;

        if (!popup.data) {
          popup.error();
          return false;
        }
        if ((source || !popup.data.source) && source !== popup.data.source) {

          var data = {};
          data[popup.url] = {draft: draft};
          popup.el.draftRemoveLink.classList.remove('is-hidden');
          chrome.storage.local.set(data);

          // Auto switch 'enable checkbox' on source edit
          if (!popup.el.enableCheck.classList.contains('not-auto-change')) {
            popup.el.enableCheck.checked = true;
          }
        }
      },
      draftAutoSaveInterval = setInterval(draftAutoSave, 1000);


  /**
   * Change host by select
   */

  popup.el.hostSelect.addEventListener('change', function(e) {
    var host = this.value;
    chrome.storage.sync.get(host, function(items) {
      var hostData = items[host];
      if (host !== popup.url) {
        // Stop making drafts
        clearInterval(draftAutoSaveInterval);

        // Show goto link
        popup.el.hostGoToLink.classList.remove('is-hidden');

        // Hide controls
        popup.el.saveBtn.classList.add('pure-button-disabled');
        popup.el.resetBtn.classList.add('pure-button-disabled');
        popup.el.draftRemoveLink.classList.add('is-hidden');

        // Apply other host data
        try {
          popup.applyData(hostData, true);
        }
            // Hotfix for host without customjs
        catch (err) {
          popup.applyData(Object.assign(true, {}, popup.emptyDataPattern), true);
        }
      }
      else {
        // Start making drafts
        draftAutoSaveInterval = setInterval(draftAutoSave, 1000);

        // Hide goto link
        popup.el.hostGoToLink.classList.add('is-hidden');

        // Show controls
        popup.el.saveBtn.classList.remove('pure-button-disabled');
        popup.el.resetBtn.classList.remove('pure-button-disabled');
        chrome.storage.local.get(popup.url, function(items) {
          if (items && Object.keys(items).length !== 0) { // if draft exists
            popup.applyData(items[popup.url].draft);
            popup.el.draftRemoveLink.classList.remove('is-hidden');
          } else {
            popup.applyData(hostData);
            popup.el.draftRemoveLink.classList.add('is-hidden');

          }
        });
      }
    });

  });


  /**
   * Protect 'enable checkbox' if was manually modified
   */
  popup.el.enableCheck.addEventListener('click', function() {
    this.classList.add('not-auto-change');
  });

  /**
   * Save script
   */

  popup.el.saveBtn.addEventListener('click', popup.save);

  /**
   * Reset script
   */

  popup.el.resetBtn.addEventListener('click', popup.reset);


  /**
   * Remove draft
   */

  popup.el.draftRemoveLink.addEventListener('click', popup.removeDraft);

  popup.piwik.loadExpertMode();

  popup.el.expertMode.addEventListener("change", function(event) {
    var enabled = event.target.checked;
    popup.piwik.setExpertMode(enabled)
  });

  chrome.storage.sync.get("piwik", function(items) {
    if (items && Object.keys(items).length !== 0) {
      popup.el.piwikURL.value = items.items.piwikURL;
      popup.el.siteID.value = items.piwik.siteID;
    }
  });


}, false);

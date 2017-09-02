function initl18n() {
  var translatableIDs = ["global-label", "save", "reset"];
  translatableIDs.forEach(function(id) {
    var translateKey = id.replace(/-/g, "_");
    document.getElementById(id).innerText = chrome.i18n.getMessage(translateKey);
  });
}

function initAce() {
  var editor = ace.edit(document.getElementById("ace-editor"));
  editor.setTheme("ace/theme/tomorrow");
  editor.getSession().setMode("ace/mode/javascript");
  editor.$blockScrolling = Infinity;
  editor.setReadOnly(true);
  editor.setHighlightGutterLine(false);
  editor.setHighlightActiveLine(false);
  return editor;
}


initl18n();
var editor = initAce();

var globalEl = document.getElementById("global");

globalEl.addEventListener("click", function() {
  var enabled = globalEl.checked;
  editor.setOptions({
    readOnly: !enabled,
    highlightActiveLine: enabled,
    highlightGutterLine: enabled
  });
  if (globalEl.checked) {
  }
});

document.getElementById("save").addEventListener("click", function() {
  chrome.storage.sync.set({global: {enabled: globalEl.checked, js: editor.getValue()}}, function() {
    window.close();
  });
});

chrome.storage.sync.get("global", function(items) {
  if (items && Object.keys(items).length !== 0) {
    var global = items.global;
    editor.setValue(global.js);
    editor.gotoLine(1);
    globalEl.checked = global.enabled;
    editor.setOptions({
      readOnly: !global.enabled,
      highlightActiveLine: global.enabled,
      highlightGutterLine: global.enabled
    });
  }
});

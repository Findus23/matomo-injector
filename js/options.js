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
  chrome.storage.sync.set({global:globalEl.checked}, function() {
    window.close()
  })
});
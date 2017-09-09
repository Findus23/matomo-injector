#!/bin/bash
rm -rf libs
mkdir -p libs/purecss/
mkdir -p libs/ace/
cp node_modules/purecss/build/*.css libs/purecss/
for i in ace mode-javascript theme-chrome theme-tomorrow worker-javascript
do
cp node_modules/ace-builds/src/${i}.js libs/ace/
done
cp node_modules/ace-builds/LICENSE node_modules/ace-builds/README.md libs/ace/

# Patch out eval()
sed -e 's/eval("throw 0;" + str);/return true;/g' libs/ace/worker-javascript.js > tmp.js
mv tmp.js libs/ace/worker-javascript.js
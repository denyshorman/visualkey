const fs = require('fs');

const filePath = 'dist/visualkey/ngsw.json';

let ngswString = fs.readFileSync(filePath, 'utf8');
const ngsw = JSON.parse(ngswString);

//#region Replace absolute path with relative path
ngsw.index = ngsw.index.substring(1);

for (const assetGroup of ngsw.assetGroups) {
  for (let i = 0; i < assetGroup.urls.length; i++) {
    assetGroup.urls[i] = assetGroup.urls[i].substring(1);
  }
}

for (const path of Object.keys(ngsw.hashTable)) {
  const newPath = path.substring(1);
  ngsw.hashTable[newPath] = ngsw.hashTable[path];
  delete ngsw.hashTable[path];
}
//#endregion

ngswString = JSON.stringify(ngsw);
fs.writeFileSync(filePath, ngswString);

const path = require('path');

const directory = 'myfolder';
const filename = 'myfile.txt';

const fullPath = path.join(directory, filename);

const test= path.join(__dirname);
console.log(test);
// main.js

import {paddingError} from './src/error/index';
const testFn = async () => {
    try { 
        // await paddingError('TestError',1231,{type:'test',info:{a:1},child:{error:'1'}});
        throw new Error("这是一个自定义异常！");
    } catch (error) {
        await paddingError('test error', 1231, {
            type: 'test',
            info: {
                a: 1
            },
            child: error
        });
    }
}
async function handleErrors() {
    try {
        const errors = await getErrorsFromIndexedDB(window.db);
        const errorsJson = JSON.stringify(errors, null, 2);
        const blob = new Blob([errorsJson], {type: 'application/json'});
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = 'errors.json';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

    } catch (error) {
        console.error('Error getting errors from IndexedDB:', error);
    }
}
// testFn();
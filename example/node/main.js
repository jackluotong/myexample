// main.js

import storeErrorInIndexedDB from './src/log/errorLog';
import { getErrorsFromIndexedDB } from './src/log/db';

// 模拟一个可能出错的操作
try {
  
    const error = {
        type: 'user',
        message: 'Division by zero',
        error: new Error('Division by zero')
      };
    await storeErrorInIndexedDB(error);
  
} catch (error) {
  console.error('Error:', error);
}

async function handleErrors() {
    try {
      const errors = await getErrorsFromIndexedDB(window.db);
      console.log('Stored errors:', errors);
      const errorsJson = JSON.stringify(errors, null, 2); 
      const blob = new Blob([errorsJson], { type: 'application/json' });
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
  handleErrors();
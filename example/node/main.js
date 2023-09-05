// main.js

import {paddingError} from './src/error/index';
import {MyTest,deployTest} from './src/log/index';
const testFn=()=>{
try {
    paddingError('TestError',1231,{type:'test',info:{a:1},child:{error:'1'}});
} catch (error) {
  throw paddingError('test error',1231,{type:'test',info:{a:1},child:error});
  }
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


  
  function test(msg,info,data){
    deployTest(msg,info,data);
  }

let data={
  age:29,
  sex:'male',
  other:{
    output:['jc','dist']
  }
}
test('this is a test',{name:'william'},data);
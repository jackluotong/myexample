// errorLogger.js

import { initIndexedDB} from './db';
export default{
  storeErrorInIndexedDB:async(errorObject) =>{
      try {
        let errorData=JSON.stringify(errorObject);
        
        const db = await initIndexedDB();
        console.log(db)
        window.db=db;
        const transaction = db.transaction(['errors'], 'readwrite');
        const objectStore = transaction.objectStore('errors');

        // const timestamp = Date.now();
        // const errorData = {
        //   timestamp,
        //   type: errorObject.type,
        //   message: errorObject.message,
        //   error: errorObject.error instanceof Error ? errorObject.error.stack : String(errorObject.error)
        // };
        console.log(errorData)
        objectStore.add(JSON.parse(errorData));
      } catch (error) {
        console.error('Error storing error in IndexedDB:', error);
      }
    },
  getErrorsFromIndexedDB:async(db)=>{
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['errors'], 'readonly');
      const objectStore = transaction.objectStore('errors');
      const getAllRequest = objectStore.getAll();

      getAllRequest.onsuccess = function(event) {
        resolve(event.target.result);
      };

      getAllRequest.onerror = function(event) {
        reject(event.error);
      };
    });
  },
   saveErrorLog:async(timestamp, errorMessage)=>{
    try {
      const db = await initIndexedDB();
      const transaction = db.transaction('errors', 'readwrite');
      const errorStore = transaction.objectStore('errors');
  
      const errorData = {
        timestamp: timestamp,
        message: errorMessage,
      };
  
      errorStore.add(errorData);
      await transaction.complete;
      console.log('Error log saved successfully');
    } catch (error) {
      console.error('Error saving error log:', error);
    }
  }
}


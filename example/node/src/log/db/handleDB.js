// errorLogger.js

import { initIndexedDB} from './db';
export default{
  storeErrorInIndexedDB:async(errorObject) =>{
  try {
    const db = await initIndexedDB();
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

    objectStore.add(errorObject);
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
}

}


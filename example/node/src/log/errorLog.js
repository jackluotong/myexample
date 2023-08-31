// errorLogger.js

import { initIndexedDB} from './db';

async function storeErrorInIndexedDB(errorObject) {
  try {
    const db = await initIndexedDB();
    window.db=db;
    const transaction = db.transaction(['errors'], 'readwrite');
    const objectStore = transaction.objectStore('errors');
    const timestamp = Date.now();

    const errorData = {
      timestamp,
      type: errorObject.type,
      message: errorObject.message,
      error: errorObject.error instanceof Error ? errorObject.error.stack : String(errorObject.error)
    };

    objectStore.add(errorData);

    console.log('Error stored in IndexedDB:', errorData);
  } catch (error) {
    console.error('Error storing error in IndexedDB:', error);
  }
}

export default storeErrorInIndexedDB;



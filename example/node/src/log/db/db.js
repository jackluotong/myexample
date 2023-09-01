
export async function initIndexedDB() {
  const indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ErrorDB', 1);

    request.onupgradeneeded = function(event) {
      const db = event.target.result;
      db.createObjectStore('errors', { keyPath: 'timestamp' });
    };

    request.onsuccess = function(event) {
      resolve(event.target.result);
    };

    request.onerror = function(event) {
      reject(event.error);
    };
  });
}

// indexDB.js

// export async function getErrorsFromIndexedDB() {
//   const indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

//   return new Promise((resolve, reject) => {
//     const request = indexedDB.open('ErrorDB', 1);

//     request.onsuccess = function(event) {
//       const db = event.target.result;

//       const transaction = db.transaction(['errors'], 'readonly');
//       const objectStore = transaction.objectStore('errors');
//       const getAllRequest = objectStore.getAll();

//       getAllRequest.onsuccess = function(event) {
//         resolve(event.target.result);
//       };

//       getAllRequest.onerror = function(event) {
//         reject(event.error);
//       };
//     };

//     request.onerror = function(event) {
//       reject(event.error);
//     };
//   });
// }

// indexDB.js

export async function getErrorsFromIndexedDB(db) {
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

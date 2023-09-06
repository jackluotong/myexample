
// export async function initIndexedDB() {
//   const indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

//   return new Promise((resolve, reject) => {
//     const request = indexedDB.open('ErrorDB', 1);

//     request.onupgradeneeded = function(event) {
//       const db = event.target.result;
//       db.createObjectStore('errors', { keyPath: 'timestamp' });
//     };

//     request.onsuccess = function(event) {
//       resolve(event.target.result);
//     };

//     request.onerror = function(event) {

//       console.error("IndexedDB error:", event.target.error);
//       reject(event.target.error);
//     };
//   });
// }


export async function initIndexedDB() {
  const indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ErrorDB', 1);

    request.onupgradeneeded = function(event) {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('errors')) {
        db.createObjectStore('errors', { keyPath: 'timestamp' });
      }
    };

    request.onsuccess = function(event) {
      const db = event.target.result;
      resolve(db);
    };

    request.onerror = function(event) {
      console.error("IndexedDB error:", event.target.error);
      reject(event.target.error);
    };
  });
}
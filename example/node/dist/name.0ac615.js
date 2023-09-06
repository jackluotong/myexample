/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./main.js":
/*!*****************!*\
  !*** ./main.js ***!
  \*****************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _src_error_index__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./src/error/index */ \"./src/error/index.js\");\n// main.js\r\n\r\n\r\nconst testFn=async()=>{\r\ntry {\r\n   await (0,_src_error_index__WEBPACK_IMPORTED_MODULE_0__.paddingError)('TestError',1231,{type:'test',info:{a:1},child:{error:'1'}});\r\n} catch (error) {\r\n  throw (0,_src_error_index__WEBPACK_IMPORTED_MODULE_0__.paddingError)('test error',1231,{type:'test',info:{a:1},child:error});\r\n  }\r\n}\r\nasync function handleErrors() {\r\n    try {\r\n      const errors = await getErrorsFromIndexedDB(window.db);\r\n      const errorsJson = JSON.stringify(errors, null, 2); \r\n      const blob = new Blob([errorsJson], { type: 'application/json' });\r\n      const downloadLink = document.createElement('a');\r\n      downloadLink.href = URL.createObjectURL(blob);\r\n      downloadLink.download = 'errors.json'; \r\n      document.body.appendChild(downloadLink);\r\n      downloadLink.click();\r\n      document.body.removeChild(downloadLink);\r\n      \r\n    } catch (error) {\r\n      console.error('Error getting errors from IndexedDB:', error);\r\n    }\r\n  }\r\ntestFn();\n\n//# sourceURL=webpack://node/./main.js?");

/***/ }),

/***/ "./src/error/index.js":
/*!****************************!*\
  !*** ./src/error/index.js ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   paddingError: () => (/* binding */ paddingError)\n/* harmony export */ });\n/* harmony import */ var _leak_index__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../leak/index */ \"./src/leak/index.js\");\n\r\nclass MyError extends Error {\r\n    constructor(msg,code,data){\r\n        super(msg);\r\n        this.code = code;\r\n        this.timestamp = new Date().getTime();\r\n        this.handleData(data);\r\n    }\r\n    handleData(data){\r\n        if(data){\r\n            let properties=['info','type'];\r\n            Object.keys(data).forEach(key=>{\r\n                if(properties.includes(key)){\r\n                    let v=data[key];\r\n                    if(v instanceof Error){\r\n                        v=JSON.stringify(v,Object.getOwnPropertyNames(v));\r\n                        v=JSON.parse(v);\r\n                    }\r\n                    if(v !==undefined){\r\n                        this[key]=v;\r\n                    }\r\n                }\r\n            })\r\n        }\r\n    }\r\n    get reason() {\r\n        return this[\"child\"];\r\n    }\r\n};\r\n\r\nconst paddingError=async(msg,code,data)=>{\r\n    let r=new MyError(msg,code,data);\r\n    await (0,_leak_index__WEBPACK_IMPORTED_MODULE_0__[\"default\"])(r);\r\n    // window.db.close();\r\n    return r;\r\n}\r\n\n\n//# sourceURL=webpack://node/./src/error/index.js?");

/***/ }),

/***/ "./src/leak/index.js":
/*!***************************!*\
  !*** ./src/leak/index.js ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var _log_db_handleDB__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../log/db/handleDB */ \"./src/log/db/handleDB.js\");\n\r\nconst leak=async(data)=>{\r\n    // console.log(data,storeErrorInIndexedDB);\r\n    let saveError=await _log_db_handleDB__WEBPACK_IMPORTED_MODULE_0__[\"default\"].storeErrorInIndexedDB(data);\r\n\r\n}\r\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (leak);\n\n//# sourceURL=webpack://node/./src/leak/index.js?");

/***/ }),

/***/ "./src/log/db/db.js":
/*!**************************!*\
  !*** ./src/log/db/db.js ***!
  \**************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   initIndexedDB: () => (/* binding */ initIndexedDB)\n/* harmony export */ });\n\r\n// export async function initIndexedDB() {\r\n//   const indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;\r\n\r\n//   return new Promise((resolve, reject) => {\r\n//     const request = indexedDB.open('ErrorDB', 1);\r\n\r\n//     request.onupgradeneeded = function(event) {\r\n//       const db = event.target.result;\r\n//       db.createObjectStore('errors', { keyPath: 'timestamp' });\r\n//     };\r\n\r\n//     request.onsuccess = function(event) {\r\n//       resolve(event.target.result);\r\n//     };\r\n\r\n//     request.onerror = function(event) {\r\n\r\n//       console.error(\"IndexedDB error:\", event.target.error);\r\n//       reject(event.target.error);\r\n//     };\r\n//   });\r\n// }\r\n\r\n\r\nasync function initIndexedDB() {\r\n  const indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;\r\n\r\n  return new Promise((resolve, reject) => {\r\n    const request = indexedDB.open('ErrorDB', 1);\r\n\r\n    request.onupgradeneeded = function(event) {\r\n      const db = event.target.result;\r\n      if (!db.objectStoreNames.contains('errors')) {\r\n        db.createObjectStore('errors', { keyPath: 'timestamp' });\r\n      }\r\n    };\r\n\r\n    request.onsuccess = function(event) {\r\n      const db = event.target.result;\r\n      resolve(db);\r\n    };\r\n\r\n    request.onerror = function(event) {\r\n      console.error(\"IndexedDB error:\", event.target.error);\r\n      reject(event.target.error);\r\n    };\r\n  });\r\n}\n\n//# sourceURL=webpack://node/./src/log/db/db.js?");

/***/ }),

/***/ "./src/log/db/handleDB.js":
/*!********************************!*\
  !*** ./src/log/db/handleDB.js ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var _db__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./db */ \"./src/log/db/db.js\");\n// errorLogger.js\r\n\r\n\r\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({\r\n  storeErrorInIndexedDB:async(errorObject) =>{\r\n      try {\r\n        let errorData=JSON.stringify(errorObject);\r\n        \r\n        const db = await (0,_db__WEBPACK_IMPORTED_MODULE_0__.initIndexedDB)();\r\n        console.log(db)\r\n        window.db=db;\r\n        const transaction = db.transaction(['errors'], 'readwrite');\r\n        const objectStore = transaction.objectStore('errors');\r\n\r\n        // const timestamp = Date.now();\r\n        // const errorData = {\r\n        //   timestamp,\r\n        //   type: errorObject.type,\r\n        //   message: errorObject.message,\r\n        //   error: errorObject.error instanceof Error ? errorObject.error.stack : String(errorObject.error)\r\n        // };\r\n        console.log(errorData)\r\n        objectStore.add(JSON.parse(errorData));\r\n      } catch (error) {\r\n        console.error('Error storing error in IndexedDB:', error);\r\n      }\r\n    },\r\n  getErrorsFromIndexedDB:async(db)=>{\r\n    return new Promise((resolve, reject) => {\r\n      const transaction = db.transaction(['errors'], 'readonly');\r\n      const objectStore = transaction.objectStore('errors');\r\n      const getAllRequest = objectStore.getAll();\r\n\r\n      getAllRequest.onsuccess = function(event) {\r\n        resolve(event.target.result);\r\n      };\r\n\r\n      getAllRequest.onerror = function(event) {\r\n        reject(event.error);\r\n      };\r\n    });\r\n  },\r\n   saveErrorLog:async(timestamp, errorMessage)=>{\r\n    try {\r\n      const db = await (0,_db__WEBPACK_IMPORTED_MODULE_0__.initIndexedDB)();\r\n      const transaction = db.transaction('errors', 'readwrite');\r\n      const errorStore = transaction.objectStore('errors');\r\n  \r\n      const errorData = {\r\n        timestamp: timestamp,\r\n        message: errorMessage,\r\n      };\r\n  \r\n      errorStore.add(errorData);\r\n      await transaction.complete;\r\n      console.log('Error log saved successfully');\r\n    } catch (error) {\r\n      console.error('Error saving error log:', error);\r\n    }\r\n  }\r\n});\r\n\r\n\n\n//# sourceURL=webpack://node/./src/log/db/handleDB.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./main.js");
/******/ 	
/******/ })()
;
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
/***/ ((module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {\n__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _src_log_errorLog__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./src/log/errorLog */ \"./src/log/errorLog.js\");\n/* harmony import */ var _src_error_index__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./src/error/index */ \"./src/error/index.js\");\n/* harmony import */ var _src_log_db__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./src/log/db */ \"./src/log/db.js\");\n// main.js\r\n\r\n\r\n\r\n\r\n\r\n// 模拟一个可能出错的操作\r\ntry {\r\n  \r\n    const error = {\r\n        type: 'user',\r\n        message: 'Division by zero',\r\n        error: new Error('Division by zero')\r\n      };\r\n    await (0,_src_log_errorLog__WEBPACK_IMPORTED_MODULE_0__[\"default\"])(error);\r\n  \r\n} catch (error) {\r\n  console.error('Error:', error);\r\n}\r\n\r\nasync function handleErrors() {\r\n    try {\r\n      const errors = await (0,_src_log_db__WEBPACK_IMPORTED_MODULE_2__.getErrorsFromIndexedDB)(window.db);\r\n      console.log('Stored errors:', errors);\r\n      console.log(_src_error_index__WEBPACK_IMPORTED_MODULE_1__[\"default\"])\r\n\r\n      const errorsJson = JSON.stringify(errors, null, 2); \r\n      const blob = new Blob([errorsJson], { type: 'application/json' });\r\n      const downloadLink = document.createElement('a');\r\n      downloadLink.href = URL.createObjectURL(blob);\r\n      downloadLink.download = 'errors.json'; \r\n      document.body.appendChild(downloadLink);\r\n      // downloadLink.click();\r\n      document.body.removeChild(downloadLink);\r\n    } catch (error) {\r\n      console.error('Error getting errors from IndexedDB:', error);\r\n    }\r\n  }\r\n  handleErrors();\n__webpack_async_result__();\n} catch(e) { __webpack_async_result__(e); } }, 1);\n\n//# sourceURL=webpack://node/./main.js?");

/***/ }),

/***/ "./src/error/index.js":
/*!****************************!*\
  !*** ./src/error/index.js ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\nclass MyError extends Error {\r\n    constructor(msg,type,code,time){\r\n        super()\r\n    }\r\n    \r\n};\r\n\r\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (MyError);\n\n//# sourceURL=webpack://node/./src/error/index.js?");

/***/ }),

/***/ "./src/log/db.js":
/*!***********************!*\
  !*** ./src/log/db.js ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   getErrorsFromIndexedDB: () => (/* binding */ getErrorsFromIndexedDB),\n/* harmony export */   initIndexedDB: () => (/* binding */ initIndexedDB)\n/* harmony export */ });\n\r\nasync function initIndexedDB() {\r\n  const indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;\r\n\r\n  return new Promise((resolve, reject) => {\r\n    const request = indexedDB.open('ErrorDB', 1);\r\n\r\n    request.onupgradeneeded = function(event) {\r\n      const db = event.target.result;\r\n      db.createObjectStore('errors', { keyPath: 'timestamp' });\r\n    };\r\n\r\n    request.onsuccess = function(event) {\r\n      resolve(event.target.result);\r\n    };\r\n\r\n    request.onerror = function(event) {\r\n      reject(event.error);\r\n    };\r\n  });\r\n}\r\n\r\n// indexDB.js\r\n\r\n// export async function getErrorsFromIndexedDB() {\r\n//   const indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;\r\n\r\n//   return new Promise((resolve, reject) => {\r\n//     const request = indexedDB.open('ErrorDB', 1);\r\n\r\n//     request.onsuccess = function(event) {\r\n//       const db = event.target.result;\r\n\r\n//       const transaction = db.transaction(['errors'], 'readonly');\r\n//       const objectStore = transaction.objectStore('errors');\r\n//       const getAllRequest = objectStore.getAll();\r\n\r\n//       getAllRequest.onsuccess = function(event) {\r\n//         resolve(event.target.result);\r\n//       };\r\n\r\n//       getAllRequest.onerror = function(event) {\r\n//         reject(event.error);\r\n//       };\r\n//     };\r\n\r\n//     request.onerror = function(event) {\r\n//       reject(event.error);\r\n//     };\r\n//   });\r\n// }\r\n\r\n// indexDB.js\r\n\r\nasync function getErrorsFromIndexedDB(db) {\r\n  return new Promise((resolve, reject) => {\r\n    const transaction = db.transaction(['errors'], 'readonly');\r\n    const objectStore = transaction.objectStore('errors');\r\n    const getAllRequest = objectStore.getAll();\r\n\r\n    getAllRequest.onsuccess = function(event) {\r\n      resolve(event.target.result);\r\n    };\r\n\r\n    getAllRequest.onerror = function(event) {\r\n      reject(event.error);\r\n    };\r\n  });\r\n}\r\n\n\n//# sourceURL=webpack://node/./src/log/db.js?");

/***/ }),

/***/ "./src/log/errorLog.js":
/*!*****************************!*\
  !*** ./src/log/errorLog.js ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var _db__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./db */ \"./src/log/db.js\");\n// errorLogger.js\r\n\r\n\r\n\r\nasync function storeErrorInIndexedDB(errorObject) {\r\n  try {\r\n    const db = await (0,_db__WEBPACK_IMPORTED_MODULE_0__.initIndexedDB)();\r\n    window.db=db;\r\n    const transaction = db.transaction(['errors'], 'readwrite');\r\n    const objectStore = transaction.objectStore('errors');\r\n    const timestamp = Date.now();\r\n\r\n    const errorData = {\r\n      timestamp,\r\n      type: errorObject.type,\r\n      message: errorObject.message,\r\n      error: errorObject.error instanceof Error ? errorObject.error.stack : String(errorObject.error)\r\n    };\r\n\r\n    objectStore.add(errorData);\r\n\r\n    console.log('Error stored in IndexedDB:', errorData);\r\n  } catch (error) {\r\n    console.error('Error storing error in IndexedDB:', error);\r\n  }\r\n}\r\n\r\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (storeErrorInIndexedDB);\r\n\r\n\r\n\n\n//# sourceURL=webpack://node/./src/log/errorLog.js?");

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
/******/ 	/* webpack/runtime/async module */
/******/ 	(() => {
/******/ 		var webpackQueues = typeof Symbol === "function" ? Symbol("webpack queues") : "__webpack_queues__";
/******/ 		var webpackExports = typeof Symbol === "function" ? Symbol("webpack exports") : "__webpack_exports__";
/******/ 		var webpackError = typeof Symbol === "function" ? Symbol("webpack error") : "__webpack_error__";
/******/ 		var resolveQueue = (queue) => {
/******/ 			if(queue && queue.d < 1) {
/******/ 				queue.d = 1;
/******/ 				queue.forEach((fn) => (fn.r--));
/******/ 				queue.forEach((fn) => (fn.r-- ? fn.r++ : fn()));
/******/ 			}
/******/ 		}
/******/ 		var wrapDeps = (deps) => (deps.map((dep) => {
/******/ 			if(dep !== null && typeof dep === "object") {
/******/ 				if(dep[webpackQueues]) return dep;
/******/ 				if(dep.then) {
/******/ 					var queue = [];
/******/ 					queue.d = 0;
/******/ 					dep.then((r) => {
/******/ 						obj[webpackExports] = r;
/******/ 						resolveQueue(queue);
/******/ 					}, (e) => {
/******/ 						obj[webpackError] = e;
/******/ 						resolveQueue(queue);
/******/ 					});
/******/ 					var obj = {};
/******/ 					obj[webpackQueues] = (fn) => (fn(queue));
/******/ 					return obj;
/******/ 				}
/******/ 			}
/******/ 			var ret = {};
/******/ 			ret[webpackQueues] = x => {};
/******/ 			ret[webpackExports] = dep;
/******/ 			return ret;
/******/ 		}));
/******/ 		__webpack_require__.a = (module, body, hasAwait) => {
/******/ 			var queue;
/******/ 			hasAwait && ((queue = []).d = -1);
/******/ 			var depQueues = new Set();
/******/ 			var exports = module.exports;
/******/ 			var currentDeps;
/******/ 			var outerResolve;
/******/ 			var reject;
/******/ 			var promise = new Promise((resolve, rej) => {
/******/ 				reject = rej;
/******/ 				outerResolve = resolve;
/******/ 			});
/******/ 			promise[webpackExports] = exports;
/******/ 			promise[webpackQueues] = (fn) => (queue && fn(queue), depQueues.forEach(fn), promise["catch"](x => {}));
/******/ 			module.exports = promise;
/******/ 			body((deps) => {
/******/ 				currentDeps = wrapDeps(deps);
/******/ 				var fn;
/******/ 				var getResult = () => (currentDeps.map((d) => {
/******/ 					if(d[webpackError]) throw d[webpackError];
/******/ 					return d[webpackExports];
/******/ 				}))
/******/ 				var promise = new Promise((resolve) => {
/******/ 					fn = () => (resolve(getResult));
/******/ 					fn.r = 0;
/******/ 					var fnQueue = (q) => (q !== queue && !depQueues.has(q) && (depQueues.add(q), q && !q.d && (fn.r++, q.push(fn))));
/******/ 					currentDeps.map((dep) => (dep[webpackQueues](fnQueue)));
/******/ 				});
/******/ 				return fn.r ? promise : getResult();
/******/ 			}, (err) => ((err ? reject(promise[webpackError] = err) : outerResolve(exports)), resolveQueue(queue)));
/******/ 			queue && queue.d < 0 && (queue.d = 0);
/******/ 		};
/******/ 	})();
/******/ 	
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
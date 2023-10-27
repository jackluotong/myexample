/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["my"] = factory();
	else
		root["my"] = factory();
})(self, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var _test__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./test */ \"./src/test.js\");\n\r\n// import ffmpeg from \"@ffmpeg/ffmpeg\";\r\n// const FFmpeg = require(\"ffmpeg.js\");\r\nconst fs = __webpack_require__(Object(function webpackMissingModule() { var e = new Error(\"Cannot find module 'fs'\"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));\r\n\r\n// 要转换的文件\r\nconst inputFile = \"input.mkv\";\r\nconst outputFile = \"output.mp4\";\r\n\r\n// 配置 FFmpeg.js\r\nconst ffmpeg = FFmpeg.createFFmpeg({\r\n  log: true,\r\n});\r\n\r\n// 加载 FFmpeg.js\r\n(async () => {\r\n  await ffmpeg.load();\r\n  await ffmpeg.write(\"input.mkv\", fs.readFileSync(inputFile));\r\n  // 转换 MKV 到 MP4\r\n  await ffmpeg.run(\"-i\", \"input.mkv\", \"output.mp4\");\r\n  const data = ffmpeg.read(\"output.mp4\");\r\n  fs.writeFileSync(outputFile, data);\r\n  console.log(\"Conversion complete\");\r\n  ffmpeg.exit();\r\n})();\r\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({ math: _test__WEBPACK_IMPORTED_MODULE_0__, ffmpeg });\r\n\n\n//# sourceURL=webpack://my/./src/index.js?");

/***/ }),

/***/ "./src/test.js":
/*!*********************!*\
  !*** ./src/test.js ***!
  \*********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   addDa: () => (/* binding */ addDa),\n/* harmony export */   division: () => (/* binding */ division),\n/* harmony export */   minus: () => (/* binding */ minus),\n/* harmony export */   multiply: () => (/* binding */ multiply),\n/* harmony export */   ssss: () => (/* binding */ ssss)\n/* harmony export */ });\n// math.js\r\nfunction addDa(a, b) {\r\n  return a + b;\r\n}\r\n\r\nfunction minus(a, b) {\r\n  return a - b;\r\n}\r\n\r\nfunction multiply(a, b) {\r\n  return a * b;\r\n}\r\n\r\nfunction division(a, b) {\r\n  return a / b - 1;\r\n}\r\nfunction ssss(a, b) {\r\n  return a / b - 1;\r\n}\r\n\n\n//# sourceURL=webpack://my/./src/test.js?");

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
/******/ 	var __webpack_exports__ = __webpack_require__("./src/index.js");
/******/ 	__webpack_exports__ = __webpack_exports__["default"];
/******/ 	
/******/ 	return __webpack_exports__;
/******/ })()
;
});
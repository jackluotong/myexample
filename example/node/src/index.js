const os = require("os");
const express=require("express");
const koa=require("koa");

// 获取 CPU 信息
const cpuModel = os.cpus()[0].model;
console.log("CPU 型号：", cpuModel,express,koa);
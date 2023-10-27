/**
 * for learning child process
 */
// On Windows Only...
// const { spawn } = require("child_process");
// const bat = spawn("cmd.exe", ["/c", "my.bat"]);

// bat.stdout.on("data", (data) => {
//   console.log(data.toString());
// });

// bat.stderr.on("data", (data) => {
//   console.error(data.toString());
// });

// bat.on("exit", (code) => {
//   console.log(`Child exited with code ${code}`);
// });
// const { spawn } = require("child_process");

// const childProcess = spawn("ls", ["-l", "/usr"]); // 示例：列出 /usr 目录内容

// childProcess.stdout.on("data", (data) => {
//   console.log(`stdout: ${data}`);
// });

// childProcess.stderr.on("data", (data) => {
//   console.error(`stderr: ${data}`);
// });

// childProcess.on("close", (code) => {
//   console.log(`子进程退出，退出码 ${code}`);
// });
// const mysql = require("mysql");

// console.log(mysql);

// const obj = { value: 42 };
// function printValue() {
//   console.log(this, this.value);
// }
// const boundPrint = printValue.bind(obj); //不带参数，返回一个函数
// boundPrint(); // 输出 42

// const obj1 = { value: 422 };
// function printValue1(prefix, s) {
//   console.log(...arguments);
//   console.log(prefix + this.value + s);
// }
// printValue1.call(obj1, "Value: ", "ssss"); // 带参数，参数列表

// const obj2 = { value: 4222 };
// function printValue2(prefix, suffix) {
//   console.log("oo", ...arguments);
//   console.log(prefix + this.value + suffix);
// }
// printValue2.apply(obj1, ["Value: ", "!1", "sw"]); // 带参数，且参数为数组

// const v8 = require("v8");

// console.log(v8.cachedDataVersionTag());
// const stream = v8.getHeapSnapshot();
// stream.pipe(process.stdout);
// console.log(v8);
// 创建一个简单的钩子函数管理器
function HookManager() {
  const hooks = {};

  // 注册钩子函数
  function on(event, callback) {
    if (!hooks[event]) {
      hooks[event] = [];
    }
    hooks[event].push(callback);
  }

  // 触发钩子事件
  function emit(event, data) {
    const eventHooks = hooks[event];
    if (eventHooks) {
      eventHooks.forEach((callback) => callback(data));
    }
  }

  return { on, emit };
}

// 使用钩子函数管理器
const myHooks = HookManager();

// 注册钩子函数
myHooks.on("beforeSave", (data) => {
  console.log("执行前置钩子函数 - 数据保存前：", data);
  // 可以在此处执行自定义逻辑，例如数据验证、预处理等
});

myHooks.on("afterSave", (data) => {
  console.log("执行后置钩子函数 - 数据保存后：", data);
  // 可以在此处执行自定义逻辑，例如日志记录、触发其他操作等
});

// 模拟数据保存
function saveData(data) {
  myHooks.emit("beforeSave", data);
  console.log("数据保存中：", data);
  // 模拟数据保存逻辑
  myHooks.emit("afterSave", data);
}

// 使用自定义钩子函数来扩展数据保存过程
const dataToSave = { name: "John", age: 30 };
saveData(dataToSave);

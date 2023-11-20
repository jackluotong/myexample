const path = require('path');

const directory = 'myfolder';
const filename = 'myfile.txt';

const fullPath = path.join(directory, filename);

const test = path.join(__dirname);
console.log(test);

const a_fun = () => {
  let b = 1;
  return function () {
    console.log(b);
  };
};

function b_fun(c) {
  let c = 2;
  return function () {
    console.log(c);
  };
}

function createCounter() {
  let count = 0; // 外部函数的变量

  function increment() {
    count++; // 内部函数可以访问外部函数的变量
    console.log(count);
  }

  function decrement() {
    count--;
    console.log(count);
  }

  return {
    increment, // 返回内部函数作为对象的方法
    decrement,
  };
}

const counter = createCounter(); // 创建一个计数器
counter.increment(); // 输出 1
counter.increment(); // 输出 2
counter.decrement(); // 输出 1

console.log('Start');

setTimeout(() => {
  console.log('Timeout 1');
}, 0);

setTimeout(() => {
  console.log('Timeout 2');
}, 0);

Promise.resolve().then(() => {
  console.log('Promise 1');
});

console.log('End');

console.log('Start');

async function delay() {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log('Delayed 1 second');
}

delay().then(() => {
  console.log('Async function finished');
});

console.log('End');

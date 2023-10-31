// 监听来自主线程的消息
self.onmessage = function (e) {
  console.log(e, "[eeee]");
  console.log("Message from Main Thread: ", e.data);

  const result = doSomeWork();

  self.postMessage("Result from Worker: " + result);
};

function doSomeWork() {
  let result = 0;
  for (let i = 0; i < 1000000000; i++) {
    result += i;
  }
  return result;
}
function stop() {
  console.log("stop worker!");
}

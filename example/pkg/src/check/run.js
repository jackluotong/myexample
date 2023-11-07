const { exec } = require("child_process");

const processName = "ffmpeg-transfer.exe";

function isProcessRunning(processName) {
  return new Promise((resolve, reject) => {
    exec(
      `tasklist /fi "imagename eq ${processName}"`,
      (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }

        const isRunning = stdout
          .toLowerCase()
          .includes(processName.toLowerCase());
        resolve(isRunning);
      }
    );
  });
}

isProcessRunning(processName)
  .then((running) => {
    if (running) {
      console.log(`${processName} 正在运行。`);
    } else {
      console.log(`${processName} 未运行或未找到。`);
    }
  })
  .catch((error) => {
    console.error(`检查进程时出现错误：${error}`);
  });

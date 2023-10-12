const os = require('os');

const networkInterfaces = os.networkInterfaces();
const macAddress = networkInterfaces['以太网'][0].mac; // 替换 '以太网' 为您的网络接口名称

console.log('MAC 地址:', macAddress);
    
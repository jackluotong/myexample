self.addEventListener('beforeinstallprompt', function(event) {
    // 阻止默认的安装提示
    event.preventDefault();
  });
  
  self.addEventListener('beforeunload', function(event) {
    event.preventDefault();
  
    const confirmationMessage = '确定要离开吗？';
  
    event.returnValue = confirmationMessage;
  
    // 弹出自定义弹框
    self.clients.matchAll().then(function(clients) {
      clients.forEach(function(client) {
        client.postMessage({ type: 'showCustomDialog', message: confirmationMessage });
      });
    });
  });
  
  self.addEventListener('message', function(event) {
    if (event.data.type === 'leavePage') {
      // 用户选择离开页面，执行离开操作
      // ...
    }
  });
  
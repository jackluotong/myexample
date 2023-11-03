const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld("expressApi", {
  startServer: () => {
    require('./transfer.js')
  },
});

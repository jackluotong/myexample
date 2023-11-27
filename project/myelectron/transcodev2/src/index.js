const express = require("express");
const app = express();
const port = 3000;

const routes = require("./router");

// 使用路由
app.use("/v1", routes);

// 启动服务器
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

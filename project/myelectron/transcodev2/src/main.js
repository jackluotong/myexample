const express = require("express");
const app = express();
const port = 9000;

const routes = require("./routes");

app.use("/v1", routes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

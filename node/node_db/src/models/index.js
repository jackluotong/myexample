const express = require("express");
const app = express();
require("dotenv").config();
const port = process.env.PORT;

const { createTableAndInsertData, insertData } = require("../db/index");

app.post("/login", async (req, res, next) => {
  const { username } = req.query;
  const data = await createTableAndInsertData(username);
  console.log(data)
  res.send({ status: "success", data: data[0] });
});
app.post("/insert", async (req, res, next) => {
  const { name, email } = req.query;
  let r = await insertData(name, email);
  res.json({ status: r });
});
app.get('/',(req,res)=>{
  res.send({ status: "success"})
});
app.listen(port, () => {
  console.log(`listening on ${port}`);
});

const express = require("express");
const router = express.Router();

router.get("/test", (req, res) => {
  res.send("Hello World!");
});
router.get("/users", (req, res) => {
  res.send({ msg: "success" });
});
module.exports = router;

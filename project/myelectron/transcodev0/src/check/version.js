const { version } = require("../../package.json");
function checkVersion(app) {
  app.get("/getVersion", (req, res) => {
    res.json({ version });
  });
}

module.exports = { checkVersion };

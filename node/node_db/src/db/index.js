const mysql = require("mysql2/promise");
const fs = require("fs");
const db_config = require("../config/db.config");
let my_connect;
function save(dataToSave) {
  fs.writeFile("res.json", dataToSave, (err) => {
    if (err) {
      console.error("写入文件时出错：", err);
    } else {
      console.log("数据已成功保存到 res.json 文件。");
    }
  });
}

async function createTableAndInsertData(userName) {
  try {
    const connection = await mysql.createConnection(db_config);
    console.log(connection)
    my_connect = connection;
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL
      )
    `;
    await connection.execute(createTableSQL);
    const searchDataSQL = `
      SELECT *FROM users
      WHERE username = '${userName}'
    `;
    return await connection.execute(searchDataSQL);
    // let j = JSON.stringify(r);
    // save(j)

    //require('events').EventEmitter.defaultMaxListeners = 0;
    await connection.end();
  } catch (error) {
    console.error("Error:", error);
  }
}

async function insertData(name, email) {
  try {
    const connection = await mysql.createConnection(db_config);
    const insertDataSQL = `
  INSERT INTO users (username, email)
  VALUES
    ('${name}', '${email}')
`;
    const [result, fields] = await connection.execute(insertDataSQL);
    if (result.affectedRows > 0) {
      return { insertStatus: true };
    } else {
      return { insertStatus: false };
    }
  } catch (error) {
    throw new Error("Error:", error);
  }
}
module.exports = {
  createTableAndInsertData,
  insertData,
};

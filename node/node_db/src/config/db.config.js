module.exports = {
  host: 'localhost',     
  user: 'root',     
  password: 'root', 
  database: 'test_db', 
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

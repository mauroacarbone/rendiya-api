require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');

const useSqlite = process.env.DB_DIALECT === 'sqlite' || !process.env.DB_HOST;
const sqlitePath = process.env.SQLITE_PATH || path.join(__dirname, '..', 'data', 'rendiya-api.sqlite');

const sequelize = useSqlite
  ? new Sequelize({
      dialect: 'sqlite',
      storage: sqlitePath,
      logging: false,
    })
  : new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
      host: process.env.DB_HOST,
      dialect: 'mysql',
      logging: false,
    });

const ensureDatabase = async () => {
  if (useSqlite) {
    fs.mkdirSync(path.dirname(sqlitePath), { recursive: true });
    return;
  }

  const mysql = require('mysql2/promise');
  const dbName = process.env.DB_NAME;
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
  });

  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${String(dbName).replace(/`/g, '')}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await connection.end();
};

module.exports = sequelize;
module.exports.ensureDatabase = ensureDatabase;

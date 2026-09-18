require('dotenv').config();
const mysql = require('mysql2/promise');
const { Sequelize } = require('sequelize');

const dbName = process.env.DB_NAME;

const sequelize = new Sequelize(dbName, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  dialect: 'mysql',
  logging: false,
});

const ensureDatabase = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
  });

  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${dbName.replace(/`/g, '')}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await connection.end();
};

module.exports = sequelize;
module.exports.ensureDatabase = ensureDatabase;

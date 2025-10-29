require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false
  }
);

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connessione al database MySQL riuscita!');
    return true;
  } catch (error) {
    console.error('❌ Errore connessione database:', error.message);
    return false;
  }
};

module.exports = { sequelize, testConnection };
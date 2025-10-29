const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Alloggiato = sequelize.define('Alloggiato', {
  matricola: {
    type: DataTypes.STRING(20),
    primaryKey: true,
    allowNull: false
  },
  id_grado: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'gradi',
      key: 'id'
    }
  },
  cognome: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  nome: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  telefono: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  codice_reparto: {
    type: DataTypes.STRING(6),
    allowNull: true
  },
  descrizione_reparto: {
    type: DataTypes.STRING(200),
    allowNull: true
  }
}, {
  tableName: 'alloggiati',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['cognome'] },
    { fields: ['id_grado'] },
    { fields: ['codice_reparto'] }
  ]
});

module.exports = Alloggiato;
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Assegnazione = sequelize.define('Assegnazione', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  matricola_alloggiato: {
    type: DataTypes.STRING(20),
    allowNull: false,
    references: {
      model: 'alloggiati',
      key: 'matricola'
    }
  },
  id_camera: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'camere',
      key: 'id'
    }
  },
  data_assegnazione: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  data_uscita: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'assegnazioni',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['matricola_alloggiato'] },
    { fields: ['id_camera'] },
    { fields: ['data_assegnazione'] },
    { fields: ['data_uscita'] }
  ]
});

module.exports = Assegnazione;
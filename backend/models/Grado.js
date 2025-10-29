const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Grado = sequelize.define('Grado', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  codice: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  descrizione: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  id_categoria: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'categorie',
      key: 'id'
    }
  },
  ordinamento: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'gradi',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['id_categoria'] },
    { fields: ['ordinamento'] }
  ]
});

module.exports = Grado;
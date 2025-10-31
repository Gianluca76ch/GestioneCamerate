const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Camera = sequelize.define('Camera', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  numero_camera: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  piano: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  ala: {
    type: DataTypes.ENUM('levante', 'ponente'),
    allowNull: true
  },
  edificio: {
    type: DataTypes.ENUM('nuovo', 'vecchio'),
    allowNull: false
  },
  nr_posti: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1
    }
  },
  genere: {
    type: DataTypes.ENUM('maschile', 'femminile'),
    allowNull: false
  },
  id_categoria: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'categorie',
      key: 'id'
    }
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  agibile: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Indica se la camera è agibile (se NO non si possono assegnare militari)'
  },
  manutenzione: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica se la camera è in manutenzione (solo informativo, nessun vincolo)'
  }
}, {
  tableName: 'camere',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['numero_camera'] },
    { fields: ['edificio', 'piano'] },
    { fields: ['id_categoria'] },
    { fields: ['genere'] },
    { fields: ['agibile'] }
  ]
});

module.exports = Camera;
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StoricoAssegnazione = sequelize.define('StoricoAssegnazione', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  matricola_alloggiato: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'Matricola del militare'
  },
  grado: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Grado del militare al momento dell\'assegnazione'
  },
  cognome: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Cognome del militare'
  },
  nome: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Nome del militare'
  },
  id_camera: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID della camera'
  },
  numero_camera: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'Numero della camera per riferimento veloce'
  },
  edificio: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Edificio della camera'
  },
  piano: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Piano della camera'
  },
  data_entrata: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'Data di ingresso nella camera'
  },
  data_uscita: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'Data di uscita dalla camera'
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Note aggiuntive'
  },
  inserito_da: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Utente che ha registrato l\'uscita'
  }
}, {
  tableName: 'storico_assegnazioni',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['matricola_alloggiato'] },
    { fields: ['id_camera'] },
    { fields: ['data_entrata'] },
    { fields: ['data_uscita'] },
    { fields: ['numero_camera'] }
  ]
});

module.exports = StoricoAssegnazione;
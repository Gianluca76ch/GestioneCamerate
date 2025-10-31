const { sequelize } = require('../config/database');
const Categoria = require('./Categoria');
const Grado = require('./Grado');
const Camera = require('./Camera');
const Alloggiato = require('./Alloggiato');
const Assegnazione = require('./Assegnazione');
const StoricoAssegnazione = require('./StoricoAssegnazione');

// =====================================================
// DEFINIZIONE RELAZIONI
// =====================================================

// Categoria -> Gradi (1:N)
Categoria.hasMany(Grado, {
  foreignKey: 'id_categoria',
  as: 'gradi'
});
Grado.belongsTo(Categoria, {
  foreignKey: 'id_categoria',
  as: 'categoria'
});

// Categoria -> Camere (1:N)
Categoria.hasMany(Camera, {
  foreignKey: 'id_categoria',
  as: 'camere'
});
Camera.belongsTo(Categoria, {
  foreignKey: 'id_categoria',
  as: 'categoria'
});

// Grado -> Alloggiati (1:N)
Grado.hasMany(Alloggiato, {
  foreignKey: 'id_grado',
  as: 'alloggiati'
});
Alloggiato.belongsTo(Grado, {
  foreignKey: 'id_grado',
  as: 'grado'
});

// Alloggiato -> Assegnazioni (1:N)
Alloggiato.hasMany(Assegnazione, {
  foreignKey: 'matricola_alloggiato',
  as: 'assegnazioni'
});
Assegnazione.belongsTo(Alloggiato, {
  foreignKey: 'matricola_alloggiato',
  as: 'alloggiato'
});

// Camera -> Assegnazioni (1:N)
Camera.hasMany(Assegnazione, {
  foreignKey: 'id_camera',
  as: 'assegnazioni'
});
Assegnazione.belongsTo(Camera, {
  foreignKey: 'id_camera',
  as: 'camera'
});

// =====================================================
// NOTA: StoricoAssegnazione non ha relazioni FK
// perché conserva dati storici denormalizzati
// =====================================================

// =====================================================
// ESPORTAZIONE
// =====================================================

module.exports = {
  sequelize,
  Categoria,
  Grado,
  Camera,
  Alloggiato,
  Assegnazione,
  StoricoAssegnazione
};
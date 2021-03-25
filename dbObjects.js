const Sequelize = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL,{logging: false});

const Servers = require('./models/Servers')(sequelize, Sequelize.DataTypes)
const Types = require('./models/Types')(sequelize, Sequelize.DataTypes)

Servers.prototype.getTypeConfig = function() {
  return Types.findByPk(this.type);
};

module.exports = { Servers, Types };

const Sequelize = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL,{logging: false});

const Servers = sequelize.import('models/Servers');
const Types = sequelize.import('models/Types');

Servers.prototype.getTypeConfig = function() {
  return Types.findByPk(this.type);
};

module.exports = { Servers, Types };

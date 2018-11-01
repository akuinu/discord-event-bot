const Sequelize = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect:  'postgres',
    protocol: 'postgres',
    port:     5432,
    logging:  true //false
  });

const Servers = sequelize.import('models/Servers');
const Types = sequelize.import('models/Types');

Servers.prototype.getTypeConfig = function() {
  return Types.findById(this.type);
};

module.exports = { Servers, Types };

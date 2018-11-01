const Sequelize = require('sequelize');
let sequelize;
if (process.env.NODE_ENV == "development") {
  sequelize = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    operatorsAliases: false,
    // SQLite only
    storage: 'database.sqlite',
  });
} else {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect:  'postgres',
    protocol: 'postgres',
    port:     5432,
    logging:  true //false
  });
}

const Servers = sequelize.import('models/Servers');
const Types = sequelize.import('models/Types');

Servers.prototype.getTypeConfig = function() {
  return Types.findByPk(this.type);
};

module.exports = { Servers, Types };

const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    operatorsAliases: false,
    // SQLite only
    storage: 'database.sqlite',
});

const Servers = sequelize.import('models/Servers');
const Types = sequelize.import('models/Types');

Servers.prototype.getTypeConfig = function() {
  return sequelize.query("select * from (select * from types where id = $typeID  union  select * from types where id = 1) ORDER by id DESC limit 1;",
    { bind: { typeID: this.type }, type: sequelize.QueryTypes.SELECT });
};

module.exports = { Servers, Types };

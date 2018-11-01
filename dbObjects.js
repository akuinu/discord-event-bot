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
  return sequelize.query("select * from (select * from types where id = $typeID  union  select * from types where id = 1) ORDER by id DESC limit 1 AS typeConfig;",
    { bind: { typeID: this.type }, type: sequelize.QueryTypes.SELECT });
};

module.exports = { Servers, Types };

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

module.exports = { Servers, Types };

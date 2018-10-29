module.exports = (sequelize, DataTypes) => {
	return sequelize.define('Servers', {
      serverID: {
        type: DataTypes.STRING,
        unique: true,
      },
      eventChannelID: {
        type: DataTypes.STRING
      },
      infoChannelID: {
        type: DataTypes.STRING
      },
      roleID: {
        type: DataTypes.STRING
      },
			organizerID: {
				type: DataTypes.STRING
			},
      type: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        allowNull: false,
      }
    });
}

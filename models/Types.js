module.exports = (sequelize, DataTypes) => {
	return sequelize.define('Types', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false
    },
    authorField: {
      type: DataTypes.STRING,
      defaultValue: "Race created by ",
      allowNull: false
    },
    footer: {
      type: DataTypes.STRING,
      defaultValue: "Race powered by Event Bot",
      allowNull: false
    },
    participants: {
      type: DataTypes.STRING,
      defaultValue: "Runners:",
      allowNull: false
    },
    help: {
      type: DataTypes.STRING,
      defaultValue: "No help for you",
      allowNull: false
    },
	});
}

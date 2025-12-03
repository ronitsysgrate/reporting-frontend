import { Sequelize } from 'sequelize';
import { initUserModel, User } from './user.model';
import { initRoleModel, Role } from './role.model';
import { initZoomUserModel, ZoomUser } from './zoom.model';
import { initAgentTimecardModel } from './agent-timecard.model';
import { initAgentModel } from './agent.model';

const initModels = (sequelize: Sequelize) => {
    initRoleModel(sequelize);
    initUserModel(sequelize);
    initZoomUserModel(sequelize);
    initAgentTimecardModel(sequelize);
    initAgentModel(sequelize);

    Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });
    User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });

};

export default initModels;

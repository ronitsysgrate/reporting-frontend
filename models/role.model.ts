import { Sequelize, DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';

export class Role extends Model<InferAttributes<Role>, InferCreationAttributes<Role>> {
    declare id: CreationOptional<number>;
    declare role: string;
    declare permissions: string[];
}

export const initRoleModel = (sequelize: Sequelize) => {
    Role.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            role: {
                type: DataTypes.STRING,
                allowNull: true,
                unique: true,
            },
            permissions: {
                type: DataTypes.JSONB,
                allowNull: true
            }
        },
        {
            sequelize,
            modelName: 'Role',
            tableName: 'roles',
            timestamps: false,
        }
    )
}
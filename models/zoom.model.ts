import { Sequelize, DataTypes, Model, CreationOptional } from 'sequelize';

export class ZoomUser extends Model {
    declare id: CreationOptional<number>;
    declare account_id: string;
    declare client_id: string;
    declare client_password: string;
    declare primary: boolean;
    declare time_zone: string;
}

export const initZoomUserModel = (sequelize: Sequelize) => {
    ZoomUser.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        account_id: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        client_id: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        client_password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        primary: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false,
        },
        time_zone: {
            type: DataTypes.STRING,
            allowNull: true
        }

    },
        {
            sequelize,
            modelName: 'ZoomUser',
            tableName: 'zoomuser',
            timestamps: false,
        })
}
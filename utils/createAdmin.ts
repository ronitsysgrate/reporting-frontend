import { Role } from "../models/role.model";
import { User } from "../models/user.model";
import { hashPassword } from "./bcrypt";

export const createAdminUser = async () => {
    try {
        let adminRole = await Role.findOne({ where: { role: 'admin' } });
        if (!adminRole) {
            const defaultPermissions = [
                'settings', 'agent-aux', 'login-logout', 'manage', 'role'
            ];
            adminRole = await Role.create({
                role: 'admin',
                permissions: defaultPermissions,
            });
        }

        const adminEmail = 'admin@example.com';
        const adminPassword = 'admin123';
        const adminUser = await User.findOne({ where: { email: adminEmail } });

        if (!adminUser) {
            const hashedPassword = await hashPassword(adminPassword);
            await User.create({
                name: 'Admin',
                email: adminEmail,
                password: hashedPassword,
                roleId: adminRole.id,
            });
            console.log('Admin user created successfully');
        } else {
            console.log('Admin user already exists');
        }
    } catch (error) {
        console.error('Failed to create admin user:', error);
    }
};
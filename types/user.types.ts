export interface UserAttributes {
    _id?: string;
    name: string;
    email: string;
    password?: string;
    role: 'Admin' | 'User';
    status?: 'Active' | 'Inactive';
    permission?: 'ens' | 'ers' | 'hers' | 'all';
    token?: string;
    timeZone: string;
}
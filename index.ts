import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import initializeSequelize from './config/db';
import initModels from './models';
import { createAdminUser } from './utils/createAdmin';

const PORT = process.env.PORT || 9091;

const startServer = async () => {
  try {
    const sequelize = await initializeSequelize();
    await initModels(sequelize);
    await sequelize.sync({ alter: true });
    console.log('Database synced');

    await createAdminUser();

    // cron.schedule('0 0 * * *', async () => {
    //   try {
    //     await runAutoUpdates();
    //   } catch (error) {
    //     console.error('Zoom auto-update task failed:', error);
    //   }
    // });

    // setTimeout(async () => {
    //   try {
    //     await runAutoUpdates();
    //   } catch (error) {
    //     console.error('Test auto-update task failed:', error);
    //   }
    // }, 10000);

    app.listen(PORT, () => {
      console.log(`Server running at PORT: ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
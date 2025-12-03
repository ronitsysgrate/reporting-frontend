import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import errorHandler from './middlewares/errorHandler';
import authRouter from './routes/user.router';
import zoomRouter from './routes/zoom.router';
import roleRouter from './routes/role.router';
import timecardRouter from './routes/agent-timecard.router';

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use('/role', roleRouter);
app.use('/agents', timecardRouter);
app.use('/user', authRouter);
app.use('/zoom', zoomRouter);
app.use(errorHandler);

app.get('/', (_req, res) => {
  res.send('Server is running...');
});

export default app;

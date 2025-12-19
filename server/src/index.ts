import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
  }

app.use('/api', routes);

/**
 * GET / - Root endpoint
 * @route GET /
 * @returns {Object} API information
 */
app.get('/', (req, res) => {
  res.json({
    code: 200,
    message: 'Bonus4You API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      casinos: '/api/casinos',
      blogs: '/api/blogs',
      users: '/api/users',
    },
  });
});

app.use(notFoundHandler);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API URL: http://localhost:${PORT}/api`);
});

export default app;

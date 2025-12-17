import { Router } from 'express';
import casinosRouter from './casinos';
import blogsRouter from './blogs';
import usersRouter from './users';
import statsRouter from './stats';

const router = Router();

router.use('/casinos', casinosRouter);
router.use('/blogs', blogsRouter);
router.use('/users', usersRouter);
router.use('/stats', statsRouter);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    code: 200,
    status: 'OK',
    timestamp: new Date().toLocaleString('en-US', {
      timeZone: 'UTC',
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    }),
  });
});

export default router;

import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import pool from '../config/database';

const router = Router();

// GET /stats - Get aggregated statistics
router.get(
  '/',
  asyncHandler(async (req, res) => {
    // Get casino statistics
    const [casinoStats] = await pool.execute(
      `SELECT 
        COUNT(*) as totalCasinos,
        SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as publishedCasinos,
        SUM(CASE WHEN has_review = 1 THEN 1 ELSE 0 END) as casinosWithReviews,
        SUM(landing_page_views) as totalLandingViews,
        SUM(claim_bonus_clicks) as totalClaimClicks,
        SUM(review_reads) as totalReviewReads
      FROM casinos`
    );

    const casino = (casinoStats as any[])[0];

    // Get blog statistics
    const [blogStats] = await pool.execute(
      `SELECT 
        COUNT(*) as totalBlogs,
        SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as publishedBlogs
      FROM blogs`
    );

    const blog = (blogStats as any[])[0];

    // Get user statistics
    const [userStats] = await pool.execute(
      `SELECT 
        COUNT(*) as totalUsers,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as activeUsers
      FROM users`
    );

    const user = (userStats as any[])[0];

    // Calculate conversion rates
    const totalLandingViews = Number(casino.totalLandingViews) || 0;
    const totalClaimClicks = Number(casino.totalClaimClicks) || 0;
    const totalReviewReads = Number(casino.totalReviewReads) || 0;

    const claimConversionRate = totalLandingViews > 0 
      ? ((totalClaimClicks / totalLandingViews) * 100).toFixed(2)
      : '0.00';

    const reviewConversionRate = totalLandingViews > 0
      ? ((totalReviewReads / totalLandingViews) * 100).toFixed(2)
      : '0.00';

    // Get stats from last 30 days (if we had date tracking, we'd calculate this)
    // For now, we'll return all-time stats
    const stats = {
      casinos: {
        total: Number(casino.totalCasinos) || 0,
        published: Number(casino.publishedCasinos) || 0,
        withReviews: Number(casino.casinosWithReviews) || 0,
        totalLandingViews,
        totalClaimClicks,
        totalReviewReads,
        claimConversionRate: parseFloat(claimConversionRate),
        reviewConversionRate: parseFloat(reviewConversionRate),
      },
      blogs: {
        total: Number(blog.totalBlogs) || 0,
        published: Number(blog.publishedBlogs) || 0,
      },
      users: {
        total: Number(user.totalUsers) || 0,
        active: Number(user.activeUsers) || 0,
      },
      // Calculate page views (sum of all landing views)
      totalPageViews: totalLandingViews,
    };

    res.json({
      code: 200,
      data: stats,
    });
  })
);

export default router;


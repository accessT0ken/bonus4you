import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireAuth } from '../middleware/auth';
import pool from '../config/database';

const router = Router();

/**
 * GET /stats - Get aggregated statistics (admin/owner only)
 * @route GET /stats
 * @requires {string[]} auth - ['admin', 'owner']
 * @returns {Object} Aggregated statistics for casinos, blogs, and users
 */
router.get(
  '/',
  requireAuth(['admin', 'owner']),
  asyncHandler(async (req, res) => {
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

    const [blogStats] = await pool.execute(
      `SELECT 
        COUNT(*) as totalBlogs,
        SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as publishedBlogs
      FROM blogs`
    );

    const blog = (blogStats as any[])[0];

    const [userStats] = await pool.execute(
      `SELECT 
        COUNT(*) as totalUsers,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as activeUsers
      FROM users`
    );

    const user = (userStats as any[])[0];

    const totalLandingViews = Number(casino.totalLandingViews) || 0;
    const totalClaimClicks = Number(casino.totalClaimClicks) || 0;
    const totalReviewReads = Number(casino.totalReviewReads) || 0;

    const claimConversionRate = totalLandingViews > 0 
      ? ((totalClaimClicks / totalLandingViews) * 100).toFixed(2)
      : '0.00';

    const reviewConversionRate = totalLandingViews > 0
      ? ((totalReviewReads / totalLandingViews) * 100).toFixed(2)
      : '0.00';

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
      totalPageViews: totalLandingViews,
    };

    res.json({
      code: 200,
      data: stats,
    });
  })
);

export default router;


import express from 'express';
import {
    getSubscriptionPlans,
    subscribeToPlan,
    cancelSubscription,
    getUserSubscription,
    getSubscriptionInvoices,
    checkPremiumFeature
} from '../controllers/premium.controllers.js';
import isAuth from '../middlewares/isAuth.js';

const router = express.Router();

// Get subscription plans
router.get('/plans', getSubscriptionPlans);

// Subscribe to a plan
router.post('/subscribe', isAuth, subscribeToPlan);

// Cancel subscription
router.post('/cancel', isAuth, cancelSubscription);

// Get user's subscription
router.get('/subscription', isAuth, getUserSubscription);

// Get subscription invoices
router.get('/invoices', isAuth, getSubscriptionInvoices);

// Check if user has premium feature
router.get('/feature/:feature', isAuth, checkPremiumFeature);

export default router;

import Subscription from "../models/subscription.model.js";
import User from "../models/user.model.js";
import { createNotification } from "./notification.controllers.js";

// Get subscription plans
export const getSubscriptionPlans = async (req, res) => {
    try {
        // Define subscription plans
        const plans = [
            {
                id: 'premium',
                name: 'Premium',
                description: 'See who viewed your profile and how you rank against other applicants',
                features: [
                    'See who viewed your profile',
                    'Access to LinkedIn Learning courses',
                    'InMail messages',
                    'Applicant insights',
                    'Enhanced search filters'
                ],
                pricing: {
                    monthly: 29.99,
                    annual: 239.88
                }
            },
            {
                id: 'business',
                name: 'Business',
                description: 'Grow and nurture your network with advanced business tools',
                features: [
                    'All Premium features',
                    'Unlimited profile searches',
                    'Company insights',
                    'Advanced analytics',
                    'Business insights'
                ],
                pricing: {
                    monthly: 59.99,
                    annual: 575.88
                }
            },
            {
                id: 'recruiter',
                name: 'Recruiter Lite',
                description: 'Find and contact the right candidates quickly and efficiently',
                features: [
                    'All Business features',
                    'Advanced search filters',
                    'Unlimited InMail messages',
                    'Candidate tracking',
                    'Talent pipeline'
                ],
                pricing: {
                    monthly: 119.99,
                    annual: 1199.88
                }
            },
            {
                id: 'sales',
                name: 'Sales Navigator',
                description: 'Unlock sales opportunities and build relationships',
                features: [
                    'All Business features',
                    'Lead recommendations',
                    'Sales insights',
                    'CRM integration',
                    'Advanced lead and account search'
                ],
                pricing: {
                    monthly: 79.99,
                    annual: 779.88
                }
            }
        ];

        res.status(200).json(plans);
    } catch (error) {
        console.error("Get subscription plans error:", error);
        res.status(500).json({ message: error.message || "Error getting subscription plans" });
    }
};

// Subscribe to a plan
export const subscribeToPlan = async (req, res) => {
    try {
        const { plan, billingCycle, paymentMethod, paymentDetails } = req.body;
        const userId = req.userId;

        // Validate input
        if (!plan || !billingCycle || !paymentMethod) {
            return res.status(400).json({ message: "Plan, billing cycle, and payment method are required" });
        }

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if user already has an active subscription
        const existingSubscription = await Subscription.findOne({
            user: userId,
            status: 'active'
        });

        if (existingSubscription) {
            return res.status(400).json({ message: "User already has an active subscription" });
        }

        // Get plan details
        let price;
        let features;
        switch (plan) {
            case 'premium':
                price = billingCycle === 'monthly' ? 29.99 : 239.88;
                features = [
                    'See who viewed your profile',
                    'Access to LinkedIn Learning courses',
                    'InMail messages',
                    'Applicant insights',
                    'Enhanced search filters'
                ];
                break;
            case 'business':
                price = billingCycle === 'monthly' ? 59.99 : 575.88;
                features = [
                    'All Premium features',
                    'Unlimited profile searches',
                    'Company insights',
                    'Advanced analytics',
                    'Business insights'
                ];
                break;
            case 'recruiter':
                price = billingCycle === 'monthly' ? 119.99 : 1199.88;
                features = [
                    'All Business features',
                    'Advanced search filters',
                    'Unlimited InMail messages',
                    'Candidate tracking',
                    'Talent pipeline'
                ];
                break;
            case 'sales':
                price = billingCycle === 'monthly' ? 79.99 : 779.88;
                features = [
                    'All Business features',
                    'Lead recommendations',
                    'Sales insights',
                    'CRM integration',
                    'Advanced lead and account search'
                ];
                break;
            default:
                return res.status(400).json({ message: "Invalid plan" });
        }

        // Calculate end date
        const startDate = new Date();
        const endDate = new Date();
        if (billingCycle === 'monthly') {
            endDate.setMonth(endDate.getMonth() + 1);
        } else {
            endDate.setFullYear(endDate.getFullYear() + 1);
        }

        // Create subscription
        const subscription = new Subscription({
            user: userId,
            plan,
            status: 'active',
            startDate,
            endDate,
            autoRenew: true,
            paymentMethod,
            paymentDetails,
            billingCycle,
            price,
            currency: 'USD',
            features,
            invoices: [{
                invoiceNumber: `INV-${Date.now()}`,
                amount: price,
                date: new Date(),
                status: 'paid',
                pdfUrl: `/invoices/${userId}/${Date.now()}.pdf`
            }]
        });

        await subscription.save();

        // Update user's premium status
        user.isPremium = true;
        user.premiumPlan = plan;
        await user.save();

        res.status(201).json({
            message: "Subscription created successfully",
            subscription
        });
    } catch (error) {
        console.error("Subscribe to plan error:", error);
        res.status(500).json({ message: error.message || "Error subscribing to plan" });
    }
};

// Cancel subscription
export const cancelSubscription = async (req, res) => {
    try {
        const userId = req.userId;

        // Find active subscription
        const subscription = await Subscription.findOne({
            user: userId,
            status: 'active'
        });

        if (!subscription) {
            return res.status(404).json({ message: "No active subscription found" });
        }

        // Update subscription
        subscription.status = 'canceled';
        subscription.autoRenew = false;
        await subscription.save();

        // Update user's premium status (will remain premium until end date)
        const user = await User.findById(userId);
        if (user) {
            // Schedule removal of premium status at end date
            const now = new Date();
            const endDate = new Date(subscription.endDate);
            
            if (endDate <= now) {
                // If subscription already ended, remove premium status immediately
                user.isPremium = false;
                user.premiumPlan = null;
                await user.save();
            }
        }

        res.status(200).json({
            message: "Subscription canceled successfully",
            subscription
        });
    } catch (error) {
        console.error("Cancel subscription error:", error);
        res.status(500).json({ message: error.message || "Error canceling subscription" });
    }
};

// Get user's subscription
export const getUserSubscription = async (req, res) => {
    try {
        const userId = req.userId;

        // Find subscription
        const subscription = await Subscription.findOne({
            user: userId
        }).sort({ createdAt: -1 });

        if (!subscription) {
            return res.status(404).json({ message: "No subscription found" });
        }

        res.status(200).json(subscription);
    } catch (error) {
        console.error("Get user subscription error:", error);
        res.status(500).json({ message: error.message || "Error getting subscription" });
    }
};

// Get subscription invoices
export const getSubscriptionInvoices = async (req, res) => {
    try {
        const userId = req.userId;

        // Find subscription
        const subscription = await Subscription.findOne({
            user: userId
        });

        if (!subscription) {
            return res.status(404).json({ message: "No subscription found" });
        }

        res.status(200).json(subscription.invoices);
    } catch (error) {
        console.error("Get subscription invoices error:", error);
        res.status(500).json({ message: error.message || "Error getting invoices" });
    }
};

// Check if user has premium feature
export const checkPremiumFeature = async (req, res) => {
    try {
        const { feature } = req.params;
        const userId = req.userId;

        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if user is premium
        if (!user.isPremium) {
            return res.status(200).json({ 
                hasPremiumFeature: false,
                message: "User does not have premium subscription"
            });
        }

        // Find active subscription
        const subscription = await Subscription.findOne({
            user: userId,
            status: 'active'
        });

        if (!subscription) {
            return res.status(200).json({ 
                hasPremiumFeature: false,
                message: "No active subscription found"
            });
        }

        // Check if subscription includes the feature
        const hasFeature = subscription.features.includes(feature);

        res.status(200).json({
            hasPremiumFeature: hasFeature,
            message: hasFeature ? "User has access to this feature" : "User does not have access to this feature"
        });
    } catch (error) {
        console.error("Check premium feature error:", error);
        res.status(500).json({ message: error.message || "Error checking premium feature" });
    }
};

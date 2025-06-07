import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    plan: {
        type: String,
        enum: ['premium', 'business', 'recruiter', 'sales'],
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'canceled', 'expired'],
        default: 'active'
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date,
        required: true
    },
    autoRenew: {
        type: Boolean,
        default: true
    },
    paymentMethod: {
        type: String,
        enum: ['credit_card', 'paypal', 'bank_transfer'],
        required: true
    },
    paymentDetails: {
        lastFour: String,
        cardType: String,
        expiryDate: String
    },
    billingCycle: {
        type: String,
        enum: ['monthly', 'annual'],
        default: 'monthly'
    },
    price: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'USD'
    },
    features: [{
        type: String
    }],
    invoices: [{
        invoiceNumber: String,
        amount: Number,
        date: Date,
        status: {
            type: String,
            enum: ['paid', 'pending', 'failed'],
            default: 'paid'
        },
        pdfUrl: String
    }]
}, { timestamps: true });

// Create index on user
subscriptionSchema.index({ user: 1 });

const Subscription = mongoose.model("Subscription", subscriptionSchema);
export default Subscription;

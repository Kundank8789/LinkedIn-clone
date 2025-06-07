import mongoose from "mongoose";

const companySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    logo: {
        type: String,
        default: ""
    },
    coverImage: {
        type: String,
        default: ""
    },
    tagline: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    website: {
        type: String,
        trim: true
    },
    industry: {
        type: String,
        trim: true
    },
    companySize: {
        type: String,
        enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5001-10000', '10001+'],
        default: '1-10'
    },
    headquarters: {
        type: String,
        trim: true
    },
    founded: {
        type: Number
    },
    specialties: [{
        type: String,
        trim: true
    }],
    admins: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    employees: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        position: {
            type: String,
            trim: true
        },
        startDate: {
            type: Date
        },
        endDate: {
            type: Date
        },
        current: {
            type: Boolean,
            default: true
        }
    }],
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    verified: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Create text index for search
companySchema.index({ name: 'text', description: 'text', industry: 'text', specialties: 'text' });

const Company = mongoose.model("Company", companySchema);
export default Company;

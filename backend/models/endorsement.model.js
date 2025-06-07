import mongoose from "mongoose";

const endorsementSchema = new mongoose.Schema({
    skill: {
        type: String,
        required: true,
        trim: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    endorsedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Create a compound index to ensure a user can only have one endorsement per skill
endorsementSchema.index({ user: 1, skill: 1 }, { unique: true });

const Endorsement = mongoose.model("Endorsement", endorsementSchema);
export default Endorsement;

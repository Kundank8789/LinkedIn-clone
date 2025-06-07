import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    type: {
        type: String,
        enum: [
            'connection_request',
            'connection_accepted',
            'post_like',
            'post_comment',
            'message',
            'job_application',
            'application_status',
            'skill_endorsement',
            'recommendation_received'
        ],
        required: true
    },
    read: {
        type: Boolean,
        default: false
    },
    content: {
        type: String
    },
    link: {
        type: String
    },
    relatedId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'onModel'
    },
    onModel: {
        type: String,
        enum: ['Post', 'Job', 'User', 'Conversation', 'Endorsement', 'Recommendation']
    }
}, { timestamps: true });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;

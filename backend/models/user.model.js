import mongoose from "mongoose";

const userSchema= new mongoose.Schema({
    firstName:{
        type: String,
        required: true,
    },
    lastName:{
        type: String,
        required: true
    },
    userName:{
        type: String,
        required: true,
        unique: true,
    },
    email:{
        type: String,
        required: true,
        unique: true,
    },
    password:{
        type: String,
        required: true,
    },
    profileImage:{
        type: String,
        default: ""
    },
    coverImage:{
        type: String,
        default: ""
    },
    headline:{
        type: String,
        default: ""
    },
    skills:[{type: String}],
    education:[
        {
            collage:{type: String},
            degree:{type: String},
            fieldOfStudy:{type: String},
        }
    ],
    location:{
        type: String,
    },
    gender:{
        type: String,
        enum:["male","female","other"]
    },
    experience:[
        {
            title:{type: String},
            company:{type: String},
            description:{type: String},
        }
    ],
    connections:[
        {type: mongoose.Schema.Types.ObjectId,
            ref:"User"
        }
    ],
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    // Fields for connection requests
    connectionRequests: [
        {type: mongoose.Schema.Types.ObjectId, ref: "User"}
    ],
    // Fields for followers
    followers: [
        {type: mongoose.Schema.Types.ObjectId, ref: "User"}
    ],
    following: [
        {type: mongoose.Schema.Types.ObjectId, ref: "User"}
    ],
    isPremium: {
        type: Boolean,
        default: false
    },
    premiumPlan: {
        type: String,
        enum: ['premium', 'business', 'recruiter', 'sales'],
        default: null
    }
},{timestamps:true})

const User= mongoose.model("User",userSchema)
export default User
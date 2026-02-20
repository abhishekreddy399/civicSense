const mongoose = require('mongoose');

const timelineStepSchema = new mongoose.Schema({
    step: { type: String, required: true },
    date: { type: Date, default: null },
    done: { type: Boolean, default: false },
}, { _id: false });

const complaintSchema = new mongoose.Schema(
    {
        complaintId: {
            type: String,
            unique: true,
            required: true,
        },
        issueType: {
            type: String,
            required: [true, 'Issue type is required'],
            enum: ['Pothole', 'Streetlight', 'Garbage', 'Water Leakage', 'Drainage', 'Illegal Parking', 'Tree Fall', 'Other'],
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            minlength: [20, 'Description must be at least 20 characters'],
            maxlength: [500, 'Description cannot exceed 500 characters'],
        },
        imageUrl: {
            type: String,
            default: null,
        },
        imagePublicId: {
            type: String,
            default: null,
        },
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point',
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
                required: [true, 'Location coordinates are required'],
            },
        },
        address: {
            type: String,
            default: null,
        },
        area: {
            type: String,
            default: null,
        },
        city: {
            type: String,
            default: 'Mumbai',
        },
        status: {
            type: String,
            enum: ['Submitted', 'Assigned', 'In Progress', 'Resolved'],
            default: 'Submitted',
        },
        priority: {
            type: String,
            enum: ['High', 'Medium', 'Low'],
            default: 'Medium',
        },
        assignedDepartment: {
            type: String,
            default: null,
        },
        isDuplicate: {
            type: Boolean,
            default: false,
        },
        upvotes: {
            type: Number,
            default: 1,
        },
        reporterEmail: {
            type: String,
            default: null,
        },
        emailNotified: {
            type: Boolean,
            default: false,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        timeline: {
            type: [timelineStepSchema],
            default: [],
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Geospatial index for nearby queries & duplicate detection
complaintSchema.index({ location: '2dsphere' });
complaintSchema.index({ complaintId: 1 });
complaintSchema.index({ status: 1 });
complaintSchema.index({ issueType: 1 });
complaintSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Complaint', complaintSchema);

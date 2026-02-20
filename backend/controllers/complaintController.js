const Complaint = require('../models/Complaint');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');
const { generateComplaintId, getPriorityFromType, buildTimeline } = require('../utils/generateId');
const { reverseGeocode } = require('../utils/geocode');
const { sendAcknowledgmentEmail } = require('../utils/emailService');

// ─── Helper: Upload buffer to Cloudinary ─────────────────────────────────────
const uploadToCloudinary = (buffer) =>
    new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: 'civicsense', resource_type: 'image', quality: 'auto' },
            (err, result) => (err ? reject(err) : resolve(result))
        );
        streamifier.createReadStream(buffer).pipe(stream);
    });

// ─── POST /api/complaints ─────────────────────────────────────────────────────
exports.createComplaint = async (req, res, next) => {
    try {
        const { issueType, description, latitude, longitude, reporterEmail } = req.body;

        if (!issueType || !description || !latitude || !longitude) {
            return res.status(400).json({ success: false, message: 'Issue type, description, and location are required' });
        }

        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);

        // ── Duplicate detection (same type within 100m, not yet resolved) ──
        const DUPLICATE_RADIUS_METERS = 100;
        const existing = await Complaint.findOne({
            issueType,
            status: { $ne: 'Resolved' },
            location: {
                $near: {
                    $geometry: { type: 'Point', coordinates: [lng, lat] },
                    $maxDistance: DUPLICATE_RADIUS_METERS,
                },
            },
        });

        if (existing) {
            // Upvote instead of creating new
            existing.upvotes += 1;
            await existing.save();
            return res.status(200).json({
                success: true,
                isDuplicate: true,
                message: 'A similar issue already exists nearby. We have upvoted it for you.',
                complaint: existing,
            });
        }

        // ── Reverse geocode ──
        const { address, area, city } = await reverseGeocode(lng, lat);

        // ── Image upload ──
        let imageUrl = null, imagePublicId = null;
        if (req.file) {
            try {
                const result = await uploadToCloudinary(req.file.buffer);
                imageUrl = result.secure_url;
                imagePublicId = result.public_id;
            } catch (imgErr) {
                console.error('Cloudinary upload failed:', imgErr.message);
            }
        }

        // ── Build and save complaint ──
        const complaintId = generateComplaintId();
        const priority = getPriorityFromType(issueType);
        const timeline = buildTimeline('Submitted');

        const complaint = await Complaint.create({
            complaintId,
            issueType,
            description,
            imageUrl,
            imagePublicId,
            location: { type: 'Point', coordinates: [lng, lat] },
            address,
            area: area || 'Unknown Area',
            city: city || 'Mumbai',
            priority,
            status: 'Submitted',
            timeline,
            reporterEmail: reporterEmail || null,
            createdBy: req.user?._id || null,
        });

        // ── Send acknowledgment email (non-blocking) ──
        if (reporterEmail) {
            sendAcknowledgmentEmail({ to: reporterEmail, complaintId, issueType, area, city }).catch(() => { });
        }

        res.status(201).json({
            success: true,
            isDuplicate: false,
            message: 'Complaint submitted successfully',
            complaint,
        });
    } catch (error) {
        next(error);
    }
};

// ─── GET /api/complaints/:complaintId ─────────────────────────────────────────
exports.getComplaint = async (req, res, next) => {
    try {
        const complaint = await Complaint.findOne({ complaintId: req.params.complaintId })
            .populate('createdBy', 'name email');

        if (!complaint) {
            return res.status(404).json({ success: false, message: 'Complaint not found. Please check the ID and try again.' });
        }

        res.json({ success: true, complaint });
    } catch (error) {
        next(error);
    }
};

// ─── POST /api/complaints/:complaintId/upvote ─────────────────────────────────
exports.upvoteComplaint = async (req, res, next) => {
    try {
        const complaint = await Complaint.findOneAndUpdate(
            { complaintId: req.params.complaintId },
            { $inc: { upvotes: 1 } },
            { new: true }
        );

        if (!complaint) {
            return res.status(404).json({ success: false, message: 'Complaint not found' });
        }

        res.json({ success: true, upvotes: complaint.upvotes, message: 'Upvoted successfully' });
    } catch (error) {
        next(error);
    }
};

// ─── GET /api/complaints/nearby ───────────────────────────────────────────────
exports.getNearbyComplaints = async (req, res, next) => {
    try {
        const { lat, lng, radius = 500, status } = req.query;
        if (!lat || !lng) {
            return res.status(400).json({ success: false, message: 'lat and lng are required' });
        }

        const filter = {
            location: {
                $near: {
                    $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
                    $maxDistance: parseInt(radius),
                },
            },
        };
        if (status) filter.status = status;

        const complaints = await Complaint.find(filter).limit(20);
        res.json({ success: true, count: complaints.length, complaints });
    } catch (error) {
        next(error);
    }
};

const express = require('express');
const router = express.Router();
const {
    createComplaint,
    getComplaint,
    upvoteComplaint,
    getNearbyComplaints,
    reportComplaint,
    escalateComplaint,
    getEscalatedComplaints,
} = require('../controllers/complaintController');
const { protect, adminOnly, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes
router.get('/nearby', getNearbyComplaints);
router.get('/:complaintId', getComplaint);
router.post('/:complaintId/upvote', upvoteComplaint);

// ── New Complaint Escalation Routes ──
router.post('/report', protect, upload.single('image'), reportComplaint);
router.put('/escalate/:id', protect, escalateComplaint);
router.get('/admin/escalated', protect, adminOnly, getEscalatedComplaints);

// Legacy Create — optional auth (citizens who are logged in get their user ID attached)
router.post('/', optionalAuth, upload.single('image'), createComplaint);

module.exports = router;

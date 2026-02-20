const express = require('express');
const router = express.Router();
const {
    createComplaint,
    getComplaint,
    upvoteComplaint,
    getNearbyComplaints,
} = require('../controllers/complaintController');
const { optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes
router.get('/nearby', getNearbyComplaints);
router.get('/:complaintId', getComplaint);
router.post('/:complaintId/upvote', upvoteComplaint);

// Create — optional auth (citizens who are logged in get their user ID attached)
router.post('/', optionalAuth, upload.single('image'), createComplaint);

module.exports = router;

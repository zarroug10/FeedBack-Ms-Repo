const express = require('express');
const router = express.Router();
const feedbackController = require('../Controllers/feedbackController')


router.post('/submit-FeedBack', feedbackController.submitFeedBack);
router.get('/feedbacks',feedbackController.getFeedBack);
router.get('/Statistics',feedbackController.calculateOverallAverageFeedback);
router.get('/StatisticsperIncident',feedbackController.calculateAverageFeedbackPerIncident);
 
module.exports = router ; 
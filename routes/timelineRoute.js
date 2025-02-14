const express = require('express');
const router = express.Router();
const timelineController = require('../controllers/timelineController');

router.post('/', timelineController.createTimeline);
router.get('/', timelineController.getTimeline);
router.put('/:id', timelineController.updateTimeline);
router.delete('/:id', timelineController.deleteTimeline);
router.get('/:id', timelineController.getTimelineById);
router.post('/search', timelineController.searchTimeline);
router.post('/duplicate', timelineController.duplicateTimeline);

module.exports = router;

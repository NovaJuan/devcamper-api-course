const express = require('express');
const {
    getAllCourses,
    getCourse,
    addCourse,
    updateCourse,
    deleteCourse
} = require('../controllers/courses');

const Course = require('../models/Course');
const advancedResults = require('../middlewares/advancedResults');

const router = express.Router({
    mergeParams: true
});

const {
    protect,
    authorize
} = require('../middlewares/auth');

router.route('/')
    .get(advancedResults(Course, {
        path: 'bootcamp',
        select: 'name description'
    }), getAllCourses)
    .post(protect, authorize('publisher', 'admin'), addCourse);

router.route('/:id')
    .get(getCourse)
    .put(protect, authorize('publisher', 'admin'), updateCourse)
    .delete(protect, authorize('publisher', 'admin'), deleteCourse);

module.exports = router;
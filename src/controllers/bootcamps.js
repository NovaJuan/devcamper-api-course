const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middlewares/async');
const geocoder = require('../utils/geocoder');
const path = require('path');
const Bootcamp = require('../models/Bootcamp');

//@desc       Get all bootcamps
//@route      GET /api/v1/bootcamps
//@access     Public
exports.getBootcamps = asyncHandler(async (req, res, next) => {
    res.status(200).json(res.advancedResults);
})

//@desc       Get one bootcamps
//@route      GET /api/v1/bootcamps/:id
//@access     Public
exports.getBootcamp = asyncHandler(async (req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id);

    if (!bootcamp) {
        return next(
            new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
        );
    }

    res.status(200).json({
        success: true,
        data: bootcamp
    });
})

//@desc       Create bootcamp
//@route      POST /api/v1/bootcamps
//@access     Private
exports.createBootcamp = asyncHandler(async (req, res, next) => {
    // Add user to req.body
    req.body.user = req.user._id;

    //Check for published bootcamps
    const publishedBootcamp = await Bootcamp.findOne({
        user: req.user._id
    });

    //If user is not admin, can only create one bootcamp
    if (publishedBootcamp && req.user.role !== 'admin') {
        return next(new ErrorResponse(`The user with ID ${req.user._id} has already created a bootcamp`, 400));
    }

    const newBootcamp = await Bootcamp.create(req.body);
    res.status(201).json({
        success: true,
        data: newBootcamp
    });
})

//@desc       Update bootcamp
//@route      PUT /api/v1/bootcamps/:id
//@access     Private
exports.updateBootcamp = asyncHandler(async (req, res, next) => {
    let bootcamp = await Bootcamp.findById(req.params.id);

    if (!bootcamp) {
        return next(
            new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
        );
    }

    //Make sure user is bootcamp owner
    if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User ID ${req.user._id} is not authorized to update this bootcamp`, 401));
    }

    bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: bootcamp
    });
})

//@desc       Delete bootcamp
//@route      DELETE /api/v1/bootcamps/:id
//@access     Private
exports.deleteBootcamp = asyncHandler(async (req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id);

    if (!bootcamp) {
        return next(
            new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
        );
    }

    //Make sure user is bootcamp owner
    if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User ID ${req.user.id} is not authorized to delete this bootcamp`, 401));
    }

    bootcamp.remove();

    res.status(200).json({
        success: true,
        data: {}
    });
})

//@desc       Get bootcamps within a radius
//@route      GET /api/v1/bootcamps/radius/:zipcode/:distance
//@access     Public
exports.getBootcampsInRadius = asyncHandler(async (req, res, next) => {
    const {
        distance,
        zipcode
    } = req.params;

    //Get lat and lng from geocoder
    const loc = await geocoder.geocode(zipcode);
    const lat = loc[0].latitude;
    const lng = loc[0].longitude;

    //Calc radius using radians
    //Divide distante by radius od earth
    //Earth radius = 3.963 miles / 6.378 km
    const radius = distance / 3963;

    const bootcamps = await Bootcamp.find({
        location: {
            $geoWithin: {
                $centerSphere: [
                    [lng, lat], radius
                ]
            }
        }
    });

    res.status(200).json({
        success: true,
        count: bootcamps.length,
        data: bootcamps
    });
})

//@desc       Upload photo for bootcamp
//@route      PUT /api/v1/bootcamps/:id/photo
//@access     Private
exports.uploadPhoto = asyncHandler(async (req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id);

    if (!bootcamp) {
        return next(
            new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
        );
    }

    //Make sure user is bootcamp owner
    if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User ID ${req.user.id} is not authorized to update this bootcamp`, 401));
    }

    if (!req.files) {
        return next(
            new ErrorResponse(`Please upload an image`, 400)
        );
    }

    const file = req.files.file;

    if (!file.mimetype.startsWith('image')) {
        return next(new ErrorResponse('Please uplaod an image file', 400));
    }

    //Check file size
    if (file.size > process.env.MAX_FILE_UPLOAD) {
        return next(new ErrorResponse(`Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`, 400))
    }

    //Create custom filename
    file.name = `photo_${bootcamp._id}${path.extname(file.name)}`;

    file.mv(path.join(__dirname, '../', process.env.FILE_UPLOAD_PATH, file.name), async err => {
        if (err) {
            console.log(err)
            return next(new ErrorResponse('Problem with file upload', 500));
        }

        await Bootcamp.findByIdAndUpdate(bootcamp._id, {
            photo: file.name
        });
    })

    res.status(200).json({
        success: true,
        data: file.name
    });
})
const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const path = require('path');
const colors = require('colors');
const fileupload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const errorHandler = require('./middlewares/error');
const helmet = require('helmet');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const rateLimiter = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');;

//Load env vars
dotenv.config({
    path: path.join(__dirname, 'config/config.env')
});

//Connect to Database
connectDB();

//Route files
const bootcamps = require('./routes/bootcamps');
const courses = require('./routes/courses');
const auth = require('./routes/auth');
const users = require('./routes/users');
const reviews = require('./routes/reviews');

const app = express();

//Body parser
app.use(express.json());

// Cookie middleware
app.use(cookieParser());

//Dev loggin middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

//Sanitize data
app.use(mongoSanitize());

// Set security headers
app.use(helmet());

// Prevent xss
app.use(xss());

// Limiting requests rate
const limiter = rateLimiter({
    windowMs:10*60*1000, // 10 minutes
    max:100
});

app.use(limiter);

// Prevent HPP param pollution
app.use(hpp());

// Enable CORS
app.use(cors()); 

// File uploading
app.use(fileupload());

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

//mount routers
app.use('/api/v1/bootcamps', bootcamps);
app.use('/api/v1/courses', courses);
app.use('/api/v1/auth', auth);
app.use('/api/v1/users', users);
app.use('/api/v1/reviews', reviews);

//Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(
    PORT,
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold)
);

//handle unhandled promise ejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`.red);

    //Close server and exit
    server.close(() => process.exit(1));
});
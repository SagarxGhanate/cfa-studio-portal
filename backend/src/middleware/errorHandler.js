const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Prisma connection errors
  if (err.name === 'PrismaClientInitializationError') {
    return res.status(503).json({
      success: false,
      error: 'Service Unavailable',
      message: 'Database connection failed. Please try again later.',
    });
  }

  // Prisma known request errors
  if (err.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json({
      success: false,
      error: 'Database Error',
      message: 'A database error occurred. Please check your request.',
    });
  }

  // Prisma validation errors
  if (err.name === 'PrismaClientValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Invalid data provided. Please check your input.',
    });
  }

  res.status(err.status || 500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
};

module.exports = errorHandler;

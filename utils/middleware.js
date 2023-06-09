const logger = require('./logger')
const jwt = require('jsonwebtoken')
const User = require('../models/user')

const requestLogger = (request, response, next) => {
  console.log('Method:', request.method)
  console.log('Path:', request.path)
  console.log('Body:', request.body)
  logger.info('Authorization header:  ', request.headers.authorization)
  console.log('--------------------------------------')
  next()
}

const userExtractor = (request, response, next) => {
  const decodedToken = jwt.verify(request.token, process.env.SECRET)

  if (!request.token || !decodedToken.id) {
    return response.status(401).json({
      error: 'token missing or invalid'
    })
  }

  request.user = User.findById(decodedToken.id)
  next()
}

const tokenExtractor = (request, response, next) => {
  const authorization = request.get('authorization')

  request.token = null

  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    request.token = authorization.substring(7)
  }

  next()
}

const unknownEndpoint = (request, response,next) => {
  response.status(404).send({
    error: 'unknown endpoint'
  })
}

const unknownPath = (request, response,next) => {
  response.status(404).json({
    error: 'unknown Path'
  })
}

const errorHandler = (error, request, response, next) => {
  logger.error(error.message)

  if (error.name === 'CastError')
    return response.status(400).send({ error: 'malformatted id' })

  else if (error.name === 'ValidationError')
    return response.status(400).json({ error: error.message })

  else if (error.name === 'JsonWebTokenError') {
    return response.status(401).json({
      error: 'invalid token'
    })
  } else if (error.name === 'TokenExpiredError') {
    return response.status(401).json({
      error: 'token expired'
    })
  }


  next(error)
}

module.exports = {
  requestLogger,
  userExtractor,
  tokenExtractor,
  unknownEndpoint,
  unknownPath,
  errorHandler
}
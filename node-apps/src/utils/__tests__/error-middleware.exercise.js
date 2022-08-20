// Testing Middleware

import {UnauthorizedError} from 'express-jwt'
import {buildReq, buildRes, buildNext} from 'utils/generate'
import errorMiddleware from '../error-middleware'

// 🐨 Write a test for the UnauthorizedError case
test('responds with 401 for express-jwt UnauthorizedError', () => {
  const req = buildReq()
  const res = buildRes()
  const next = buildNext()

  const error = new UnauthorizedError('some_error_code', {
    message: 'Some message',
  })

  errorMiddleware(error, req, res, next)

  expect(next).not.toHaveBeenCalled()

  expect(res.status).toHaveBeenCalledTimes(1)
  expect(res.status).toHaveBeenCalledWith(401)

  expect(res.json).toHaveBeenCalledTimes(1)
  expect(res.json).toHaveBeenCalledWith({
    code: error.code,
    message: error.message,
  })
})

// 🐨 Write a test for the headersSent case
test('calls next if headersSent is true', () => {
  const req = buildReq()
  const res = buildRes({headersSent: true})
  const next = buildNext()

  const error = new UnauthorizedError('some_error_code', {
    message: 'Some message',
  })

  errorMiddleware(error, req, res, next)

  expect(next).toHaveBeenCalledTimes(1)
  expect(next).toHaveBeenLastCalledWith(error)

  expect(res.status).not.toHaveBeenCalled()
  expect(res.json).not.toHaveBeenCalled()
})

// 🐨 Write a test for the else case (responds with a 500)
test('responds with 500 error and error object', () => {
  const req = buildReq()
  const res = buildRes()
  const next = buildNext()

  const error = new Error('some_error_code', {
    message: 'Some message',
  })

  errorMiddleware(error, req, res, next)

  expect(next).not.toHaveBeenCalled()

  expect(res.status).toHaveBeenCalledTimes(1)
  expect(res.status).toHaveBeenCalledWith(500)

  expect(res.json).toHaveBeenCalledTimes(1)
  expect(res.json).toHaveBeenCalledWith({
    message: error.message,
    stack: error.stack,
  })
})

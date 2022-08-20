// Testing Authentication API Routes

import axios from 'axios'
import {resetDb} from 'utils/db-utils'
import * as generate from 'utils/generate'
import {getData, handleRequestFailure} from 'utils/async'
import startServer from '../start'

let server

beforeAll(async () => {
  server = await startServer({port: 8000})
})

afterAll(() => server.close())

// 🐨 beforeEach test in this file we want to reset the database
beforeEach(() => resetDb())

test('auth flow', async () => {
  const {username, password} = generate.loginForm()

  const baseURL = 'http://localhost:8000/api'
  // creating an axios client
  const api = axios.create({baseURL})
  api.interceptors.response.use(getData, handleRequestFailure)

  // 🐨 use axios.post to post the username and password to the registration endpoint
  const registerData = await api.post('auth/register', {username, password})

  // 🐨 assert that the result you get back is correct
  expect(registerData.user).toEqual({
    token: expect.any(String),
    id: expect.any(String),
    username
  })

  // login
  const loginData = await api.post('auth/login', {username, password})
  expect(loginData.user).toEqual(registerData.user)

  // authenticated request
  const requestData = await api.get('auth/me', {
    headers: {
      Authorization: `Bearer ${loginData.user.token}`
    }
  })

  expect(requestData.user).toEqual(loginData.user)
})

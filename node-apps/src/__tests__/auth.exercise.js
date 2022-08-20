// Testing Authentication API Routes

import axios from 'axios'
import {resetDb} from 'utils/db-utils'
import * as generate from 'utils/generate'
import * as usersDB from 'db/users'
import {getData, handleRequestFailure, resolve} from 'utils/async'
import startServer from '../start'

let api, server

beforeAll(async () => {
  server = await startServer()

  const baseURL = `http://localhost:${server.address().port}/api`

  // creating an axios client
  api = axios.create({baseURL})
  api.interceptors.response.use(getData, handleRequestFailure)
})

afterAll(() => server.close())

// 🐨 beforeEach test in this file we want to reset the database
beforeEach(() => resetDb())

test('auth flow', async () => {
  const {username, password} = generate.loginForm()

  // 🐨 use axios.post to post the username and password to the registration endpoint
  const registerData = await api.post('auth/register', {username, password})

  // 🐨 assert that the result you get back is correct
  expect(registerData.user).toEqual({
    token: expect.any(String),
    id: expect.any(String),
    username,
  })

  // login
  const loginData = await api.post('auth/login', {username, password})
  expect(loginData.user).toEqual(registerData.user)

  // authenticated request
  const requestData = await api.get('auth/me', {
    headers: {
      Authorization: `Bearer ${loginData.user.token}`,
    },
  })

  expect(requestData.user).toEqual(loginData.user)
})

test('username must be unique', async () => {
  const username = generate.username()
  await usersDB.insert(generate.buildUser({username}))

  const error = await api
    .post('auth/register', {username, password: 'This-is-A-Secure-#1'})
    .catch(resolve)

  expect(error).toMatchInlineSnapshot(
    `[Error: 400: {"message":"username taken"}]`,
  )
})

test('get me unauthenticated returns error', async () => {
  const error = await api.get('auth/me').catch(resolve)
  expect(error).toMatchInlineSnapshot(
    `[Error: 401: {"code":"credentials_required","message":"No authorization token was found"}]`,
  )
})

test('username required to register', async () => {
  const error = await api
    .post('auth/register', {password: generate.password()})
    .catch(resolve)
  expect(error).toMatchInlineSnapshot(
    `[Error: 400: {"message":"username can't be blank"}]`,
  )
})

test('password required to register', async () => {
  const error = await api
    .post('auth/register', {username: generate.username()})
    .catch(resolve)
  expect(error).toMatchInlineSnapshot(
    `[Error: 400: {"message":"password can't be blank"}]`,
  )
})

test('username required to login', async () => {
  const error = await api
    .post('auth/login', {password: generate.password()})
    .catch(resolve)
  expect(error).toMatchInlineSnapshot(
    `[Error: 400: {"message":"username can't be blank"}]`,
  )
})

test('password required to login', async () => {
  const error = await api
    .post('auth/login', {username: generate.username()})
    .catch(resolve)
  expect(error).toMatchInlineSnapshot(
    `[Error: 400: {"message":"password can't be blank"}]`,
  )
})

test('user must exist to login', async () => {
  const error = await api
    .post('auth/login', generate.loginForm({username: '__will_never_exist__'}))
    .catch(resolve)
  expect(error).toMatchInlineSnapshot(
    `[Error: 400: {"message":"username or password is invalid"}]`,
  )
})


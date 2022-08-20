// Testing CRUD API Routes

import axios from 'axios'
import {resetDb, insertTestUser} from 'utils/db-utils'
import {getData, handleRequestFailure, resolve} from 'utils/async'
import * as generate from 'utils/generate'
import * as booksDB from '../db/books'
import startServer from '../start'

let baseURL, server

beforeAll(async () => {
  server = await startServer()
  baseURL = `http://localhost:${server.address().port}/api`
})

afterAll(() => server.close())

beforeEach(() => resetDb())

async function setup() {
  const testUser = await insertTestUser()
  const authAPI = axios.create({baseURL})
  authAPI.defaults.headers.common.authorization = `Bearer ${testUser.token}`
  authAPI.interceptors.response.use(getData, handleRequestFailure)
  return {testUser, authAPI}
}

test('listItem CRUD', async () => {
  const {testUser, authAPI} = await setup()

  // 🐨 create a book object and insert it into the database
  const book = generate.buildBook()
  await booksDB.insert(book)

  // CREATE
  // 🐨 create a new list-item by posting to the list-items endpoint with a bookId
  const createData = await authAPI.post(`list-items`, {bookId: book.id})

  // 🐨 assert that the data you get back is correct
  expect(createData.listItem).toMatchObject({
    ownerId: testUser.id,
    bookId: book.id,
  })

  // 💰 you might find this useful for the future requests:
  const listItemId = createData.listItem.id
  const listItemIdUrl = `list-items/${listItemId}`

  // READ
  const readData = await authAPI.get(listItemIdUrl)
  expect(readData).toMatchObject(createData)

  // UPDATE
  const updates = {notes: generate.notes()}
  const updateResult = await authAPI.put(listItemIdUrl, updates)
  expect(updateResult).toMatchObject({
    ...readData,
    listItem: {...readData.listItem, ...updates},
  })

  // DELETE
  const deleteResult = await authAPI.delete(listItemIdUrl)
  expect(deleteResult).toEqual({success: true})

  // expect an error if we try to fetch the same resource
  const error = await authAPI.get(listItemIdUrl).catch(resolve)
  expect(error.status).toBe(404)

  // because the ID is generated, we need to replace it in the error message
  // so our snapshot remains consistent
  const idlessMessage = error.data.message.replace(listItemId, 'LIST_ITEM_ID')
  expect(idlessMessage).toMatchInlineSnapshot(
    `"No list item was found with the id of LIST_ITEM_ID"`,
  )
})

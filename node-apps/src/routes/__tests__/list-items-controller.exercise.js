// Testing Controllers

import {
  buildRes,
  buildReq,
  buildUser,
  buildBook,
  buildListItem,
} from 'utils/generate'

// 🐨 getListItem calls `expandBookData` which calls `booksDB.readById`
// so you'll need to import the booksDB from '../../db/books'
import * as booksDB from '../../db/books'
import * as listItemsController from '../list-items-controller'

// 🐨 use jest.mock to mock '../../db/books' because we don't actually want to make
// database calls in this test file.
jest.mock('../../db/books.js')

beforeEach(() => {
  // this clears return values too
  // jest.resetAllMocks()

  // this only clears call history
  jest.clearAllMocks()
})

test('getListItem returns the req.listItem', async () => {
  const user = buildUser()
  const book = buildBook()
  const listItem = buildListItem({ownerId: user.id, bookId: book.id})

  // 🐨 mock booksDB.readById to resolve to the book
  // 💰 use mockResolvedValueOnce
  booksDB.readById.mockResolvedValueOnce(book)

  const req = buildReq({user, listItem})
  const res = buildRes()

  // 🐨 make a call to getListItem with the req and res (`await` the result)
  await listItemsController.getListItem(req, res)
  // 🐨 assert that booksDB.readById was called correctly
  expect(booksDB.readById).toHaveBeenCalledTimes(1)
  expect(booksDB.readById).toHaveBeenCalledWith(book.id)
  //🐨 assert that res.json was called correctly
  expect(res.json).toHaveBeenCalledTimes(1)
  expect(res.json).toHaveBeenCalledWith({
    listItem: {...listItem, book},
  })
})

test('createListItem returns a 400 error if no bookId was passed', async () => {
  const req = buildReq()
  const res = buildRes()

  // 🐨 make a call to createListItem with the req and res (`await` the result)
  await listItemsController.createListItem(req, res)

  // 🐨 assert that the res.status
  expect(res.status).toHaveBeenCalledTimes(1)
  expect(res.status).toHaveBeenCalledWith(400)

  // 🐨 assert that res.json was called correctly
  expect(res.json).toHaveBeenCalledTimes(1)
  expect(res.json.mock.calls[0]).toMatchInlineSnapshot(`
    Array [
      Object {
        "message": "No bookId provided",
      },
    ]
  `)
})

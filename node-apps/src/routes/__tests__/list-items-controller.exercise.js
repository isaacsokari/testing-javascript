// Testing Controllers

import {
  buildRes,
  buildReq,
  buildUser,
  buildBook,
  buildListItem,
  buildNext,
} from 'utils/generate'

// 🐨 getListItem calls `expandBookData` which calls `booksDB.readById`
// so you'll need to import the booksDB from '../../db/books'
import * as booksDB from '../../db/books'
import * as listItemsDB from '../../db/list-items'
import * as listItemsController from '../list-items-controller'

// 🐨 use jest.mock to mock '../../db/books' because we don't actually want to make
// database calls in this test file.
jest.mock('../../db/books.js')
jest.mock('../../db/list-items.js')

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

describe('setListItem', () => {
  test('sets the listItem on the req object', async () => {
    const user = buildUser()
    const listItem = buildListItem({ownerId: user.id})

    const req = buildReq({params: {id: listItem.id}, user})
    const res = buildRes()
    const next = buildNext()

    listItemsDB.readById.mockResolvedValueOnce(listItem)
    await listItemsController.setListItem(req, res, next)

    expect(listItemsDB.readById).toHaveBeenCalledTimes(1)
    expect(listItemsDB.readById).toHaveBeenCalledWith(listItem.id)

    expect(next).toHaveBeenCalledTimes(1)
    expect(next).toHaveBeenCalledWith(/* nothing */)

    expect(req.listItem).toBe(listItem)
  })

  test('returns a 404 error when the listItem is not found', async () => {
    const user = buildUser()

    const fakeListItemId = null
    const req = buildReq({params: {id: fakeListItemId}, user})
    const res = buildRes()
    const next = buildNext()

    await listItemsController.setListItem(req, res, next)

    expect(listItemsDB.readById).toHaveBeenCalledTimes(1)
    expect(listItemsDB.readById).toHaveBeenCalledWith(fakeListItemId)

    expect(next).not.toHaveBeenCalled()

    expect(res.status).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(404)

    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        Object {
          "message": "No list item was found with the id of null",
        },
      ]
    `)
  })

  test("returns a 403 error when the user isn't the listItem owner", async () => {
    const user = buildUser({id: 'FAKE_USER_ID'})
    const listItem = buildListItem({
      ownerId: 'ANOTHER_FAKE_USER_ID',
      id: 'FAKE_LIST_ITEM_ID',
    })

    listItemsDB.readById.mockResolvedValueOnce(listItem)

    const req = buildReq({user, params: {id: listItem.id}})
    const res = buildRes()
    const next = buildNext()

    await listItemsController.setListItem(req, res, next)

    expect(listItemsDB.readById).toHaveBeenCalledTimes(1)
    expect(listItemsDB.readById).toHaveBeenCalledWith(listItem.id)

    expect(next).not.toHaveBeenCalledTimes(1)

    expect(res.status).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(403)

    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        Object {
          "message": "User with id FAKE_USER_ID is not authorized to access the list item FAKE_LIST_ITEM_ID",
        },
      ]
    `)
  })
})

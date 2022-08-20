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

test(`getListItems returns a user's list items`, async () => {
  const user = buildUser()

  const books = [buildBook(), buildBook()]
  const userListItems = [
    buildListItem({
      ownerId: user.id,
      bookId: books[0].id,
    }),
    buildListItem({
      ownerId: user.id,
      bookId: books[1].id,
    }),
  ]

  booksDB.readManyById.mockResolvedValueOnce(books)
  listItemsDB.query.mockResolvedValueOnce(userListItems)

  const req = buildReq({user})
  const res = buildRes()

  await listItemsController.getListItems(req, res)

  expect(listItemsDB.query).toHaveBeenCalledTimes(1)
  expect(listItemsDB.query).toHaveBeenCalledWith({ownerId: user.id})

  expect(booksDB.readManyById).toHaveBeenCalledTimes(1)
  expect(booksDB.readManyById).toHaveBeenCalledWith([books[0].id, books[1].id])

  expect(res.json).toHaveBeenCalledTimes(1)
  expect(res.json).toHaveBeenCalledWith({
    listItems: [
      {...userListItems[0], book: books[0]},
      {...userListItems[1], book: books[1]},
    ],
  })
})

test('getListItem returns a specific listItem', async () => {
  const user = buildUser()

  const books = [buildBook(), buildBook()]
  const userListItems = [
    buildListItem({
      ownerId: user.id,
      bookId: books[0].id,
    }),
    buildListItem({
      ownerId: user.id,
      bookId: books[1].id,
    }),
  ]

  const listItem = userListItems[0]
  const book = books[0]

  booksDB.readById.mockResolvedValueOnce(book)

  const req = buildReq({listItem})
  const res = buildRes()

  await listItemsController.getListItem(req, res)

  expect(booksDB.readById).toHaveBeenCalledTimes(1)
  expect(booksDB.readById).toHaveBeenCalledWith(book.id)

  expect(res.json).toHaveBeenCalledTimes(1)
  expect(res.json).toHaveBeenCalledWith({
    listItem: {...listItem, book},
  })
})

describe(`createListItem`, () => {
  test('creates and returns a listItem', async () => {
    const user = buildUser()
    const book = buildBook()

    const listItem = buildListItem({ownerId: user.id, bookId: book.id})

    listItemsDB.query.mockResolvedValueOnce([
      /* nothing */
    ])
    listItemsDB.create.mockResolvedValueOnce(listItem)
    booksDB.readById.mockResolvedValueOnce(book)

    const req = buildReq({user, body: {bookId: book.id}})
    const res = buildRes()

    await listItemsController.createListItem(req, res)

    expect(res.json).toBeCalledTimes(1)
    expect(res.json).toBeCalledWith({listItem: {...listItem, book}})
  })

  test(`returns 400 when bookId isn't provided`, async () => {
    const req = buildReq()
    const res = buildRes()

    await listItemsController.createListItem(req, res)

    expect(res.status).toBeCalledTimes(1)
    expect(res.status).toBeCalledWith(400)

    expect(res.json).toBeCalledTimes(1)
    expect(res.json.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        Object {
          "message": "No bookId provided",
        },
      ]
    `)
  })

  test(`returns 400 when book exists`, async () => {
    const user = buildUser({id: 'USER_ID'})
    const book = buildBook({id: 'BOOK_ID'})

    const listItem = buildListItem({ownerId: user.id, bookId: book.id})

    listItemsDB.query.mockResolvedValueOnce([listItem])
    listItemsDB.create.mockResolvedValueOnce(listItem)
    booksDB.readById.mockResolvedValueOnce(book)

    const req = buildReq({user, body: {bookId: book.id}})
    const res = buildRes()

    await listItemsController.createListItem(req, res)

    expect(res.json).toBeCalledTimes(1)
    expect(res.json.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        Object {
          "message": "User USER_ID already has a list item for the book with the ID BOOK_ID",
        },
      ]
    `)
  })
})

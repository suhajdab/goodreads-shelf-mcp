import type { Book } from "../../src/goodreads.js";

export function makeBook(overrides: Partial<Book> = {}): Book {
  return {
    book_id: "1",
    title: "The Pragmatic Programmer",
    author_name: "David Thomas",
    isbn: "9780135957059",
    book_published: "2019",
    average_rating: "4.37",
    user_rating: "5",
    user_read_at: "Sat Jan 01 00:00:00 -0500 2022",
    user_date_added: "2022-01-01",
    user_date_created: "2022-01-01",
    user_shelves: "read",
    user_review: "",
    num_pages: "352",
    link: "https://www.goodreads.com/book/show/1",
    book_image_url: "",
    book_description: "",
    ...overrides,
  };
}

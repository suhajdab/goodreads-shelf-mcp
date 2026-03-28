import { describe, it, expect } from "vitest";
import { searchBooks } from "../src/tools.js";
import { makeBook } from "./fixtures/books.js";

describe("searchBooks", () => {
  it("matches by title (case-insensitive)", () => {
    const books = [
      makeBook({ title: "Dune" }),
      makeBook({ title: "Foundation" }),
    ];
    expect(searchBooks(books, "dune")).toHaveLength(1);
    expect(searchBooks(books, "Dune")).toHaveLength(1);
    expect(searchBooks(books, "DUNE")).toHaveLength(1);
  });

  it("matches by partial title", () => {
    const books = [
      makeBook({ title: "Dune Messiah" }),
      makeBook({ title: "The Dune Chronicles" }),
      makeBook({ title: "Foundation" }),
    ];
    expect(searchBooks(books, "dune")).toHaveLength(2);
  });

  it("matches by author name (case-insensitive)", () => {
    const books = [
      makeBook({ author_name: "J.R.R. Tolkien" }),
      makeBook({ author_name: "Frank Herbert" }),
    ];
    expect(searchBooks(books, "tolkien")).toHaveLength(1);
    expect(searchBooks(books, "Tolkien")).toHaveLength(1);
  });

  it("matches by partial author name", () => {
    const books = [
      makeBook({ author_name: "J.R.R. Tolkien" }),
      makeBook({ author_name: "Frank Herbert" }),
    ];
    expect(searchBooks(books, "frank")).toHaveLength(1);
  });

  it("returns all books when query is empty string", () => {
    const books = [makeBook(), makeBook(), makeBook()];
    expect(searchBooks(books, "")).toHaveLength(3);
  });

  it("returns empty array when no books match", () => {
    const books = [makeBook({ title: "Dune", author_name: "Frank Herbert" })];
    expect(searchBooks(books, "tolkien")).toHaveLength(0);
  });

  it("returns multiple matches across title and author", () => {
    const books = [
      makeBook({ title: "The Tolkien Reader", author_name: "J.R.R. Tolkien" }),
      makeBook({ title: "Foundation", author_name: "Isaac Asimov" }),
    ];
    // Matches on title AND author — still one book, not duplicated
    expect(searchBooks(books, "tolkien")).toHaveLength(1);
  });

  it("returns empty array for empty book list", () => {
    expect(searchBooks([], "anything")).toHaveLength(0);
  });
});

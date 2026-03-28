import { describe, it, expect, vi, beforeEach } from "vitest";
import { getBooks } from "../src/tools.js";
import { makeBook } from "./fixtures/books.js";

vi.mock("../src/goodreads.js", () => ({
  fetchPage: vi.fn(),
  fetchPages: vi.fn(),
}));

import { fetchPage, fetchPages } from "../src/goodreads.js";

describe("getBooks", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("allPages: false (single page mode)", () => {
    it("calls fetchPage with correct arguments", async () => {
      vi.mocked(fetchPage).mockResolvedValue([]);
      await getBooks("uid", "key", "shelf", 2, false, 10);
      expect(fetchPage).toHaveBeenCalledWith("uid", "key", "shelf", 2);
      expect(fetchPages).not.toHaveBeenCalled();
    });

    it("has_more is true when page returns exactly 100 books", async () => {
      const books = Array.from({ length: 100 }, (_, i) => makeBook({ book_id: String(i) }));
      vi.mocked(fetchPage).mockResolvedValue(books);
      const result = await getBooks("uid", "key", "shelf", 1, false, 10);
      expect(result.has_more).toBe(true);
    });

    it("has_more is false when page returns fewer than 100 books", async () => {
      vi.mocked(fetchPage).mockResolvedValue([makeBook(), makeBook()]);
      const result = await getBooks("uid", "key", "shelf", 1, false, 10);
      expect(result.has_more).toBe(false);
    });

    it("has_more is false when page returns zero books", async () => {
      vi.mocked(fetchPage).mockResolvedValue([]);
      const result = await getBooks("uid", "key", "shelf", 1, false, 10);
      expect(result.has_more).toBe(false);
    });

    it("total equals number of books returned", async () => {
      const books = [makeBook(), makeBook(), makeBook()];
      vi.mocked(fetchPage).mockResolvedValue(books);
      const result = await getBooks("uid", "key", "shelf", 1, false, 10);
      expect(result.total).toBe(3);
      expect(result.books).toHaveLength(3);
    });

    it("page in result matches the requested page number", async () => {
      vi.mocked(fetchPage).mockResolvedValue([]);
      const result = await getBooks("uid", "key", "shelf", 5, false, 10);
      expect(result.page).toBe(5);
    });
  });

  describe("allPages: true (multi-page mode)", () => {
    it("calls fetchPages with startPage=1 and correct maxPages", async () => {
      vi.mocked(fetchPages).mockResolvedValue({ books: [], pagesRead: 0 });
      await getBooks("uid", "key", "shelf", 1, true, 7);
      expect(fetchPages).toHaveBeenCalledWith("uid", "key", "shelf", 1, 7);
      expect(fetchPage).not.toHaveBeenCalled();
    });

    it("has_more is always false in multi-page mode", async () => {
      const books = Array.from({ length: 200 }, (_, i) => makeBook({ book_id: String(i) }));
      vi.mocked(fetchPages).mockResolvedValue({ books, pagesRead: 2 });
      const result = await getBooks("uid", "key", "shelf", 1, true, 10);
      expect(result.has_more).toBe(false);
    });

    it("page in result equals pagesRead from fetchPages", async () => {
      vi.mocked(fetchPages).mockResolvedValue({ books: [], pagesRead: 4 });
      const result = await getBooks("uid", "key", "shelf", 1, true, 10);
      expect(result.page).toBe(4);
    });

    it("total equals number of books returned", async () => {
      const books = [makeBook(), makeBook(), makeBook()];
      vi.mocked(fetchPages).mockResolvedValue({ books, pagesRead: 1 });
      const result = await getBooks("uid", "key", "shelf", 1, true, 10);
      expect(result.total).toBe(3);
      expect(result.books).toHaveLength(3);
    });
  });
});

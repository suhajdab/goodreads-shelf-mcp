import { describe, it, expect } from "vitest";
import { applyFilters } from "../src/tools.js";
import { makeBook } from "./fixtures/books.js";

describe("applyFilters", () => {
  // ---------------------------------------------------------------------------
  // min_rating / max_rating
  // ---------------------------------------------------------------------------

  describe("min_rating", () => {
    it("includes books at or above min_rating", () => {
      const books = [makeBook({ user_rating: "4" }), makeBook({ user_rating: "5" })];
      const { matches } = applyFilters(books, { min_rating: 4 });
      expect(matches).toHaveLength(2);
    });

    it("excludes books below min_rating", () => {
      const books = [makeBook({ user_rating: "3" }), makeBook({ user_rating: "2" })];
      const { matches } = applyFilters(books, { min_rating: 4 });
      expect(matches).toHaveLength(0);
    });

    it("excludes books with empty user_rating (NaN)", () => {
      const books = [makeBook({ user_rating: "" })];
      const { matches } = applyFilters(books, { min_rating: 1 });
      expect(matches).toHaveLength(0);
    });

    it("includes books at exactly the boundary value", () => {
      const books = [makeBook({ user_rating: "3" })];
      const { matches } = applyFilters(books, { min_rating: 3 });
      expect(matches).toHaveLength(1);
    });
  });

  describe("max_rating", () => {
    it("includes books at or below max_rating", () => {
      const books = [makeBook({ user_rating: "2" }), makeBook({ user_rating: "3" })];
      const { matches } = applyFilters(books, { max_rating: 3 });
      expect(matches).toHaveLength(2);
    });

    it("excludes books above max_rating", () => {
      const books = [makeBook({ user_rating: "4" }), makeBook({ user_rating: "5" })];
      const { matches } = applyFilters(books, { max_rating: 3 });
      expect(matches).toHaveLength(0);
    });

    it("excludes books with empty user_rating (NaN)", () => {
      const books = [makeBook({ user_rating: "" })];
      const { matches } = applyFilters(books, { max_rating: 5 });
      expect(matches).toHaveLength(0);
    });
  });

  describe("min_rating + max_rating together", () => {
    it("keeps only books in the rating range", () => {
      const books = [
        makeBook({ user_rating: "2" }),
        makeBook({ user_rating: "3" }),
        makeBook({ user_rating: "4" }),
        makeBook({ user_rating: "5" }),
      ];
      const { matches } = applyFilters(books, { min_rating: 3, max_rating: 4 });
      expect(matches).toHaveLength(2);
      expect(matches.map((b) => b.user_rating)).toEqual(["3", "4"]);
    });
  });

  // ---------------------------------------------------------------------------
  // min_average_rating
  // ---------------------------------------------------------------------------

  describe("min_average_rating", () => {
    it("includes books at or above min_average_rating", () => {
      const books = [makeBook({ average_rating: "4.37" }), makeBook({ average_rating: "5.0" })];
      const { matches } = applyFilters(books, { min_average_rating: 4.0 });
      expect(matches).toHaveLength(2);
    });

    it("excludes books below min_average_rating", () => {
      const books = [makeBook({ average_rating: "3.99" })];
      const { matches } = applyFilters(books, { min_average_rating: 4.0 });
      expect(matches).toHaveLength(0);
    });

    it("excludes books with empty average_rating (NaN)", () => {
      const books = [makeBook({ average_rating: "" })];
      const { matches } = applyFilters(books, { min_average_rating: 1 });
      expect(matches).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // shelf_name
  // ---------------------------------------------------------------------------

  describe("shelf_name", () => {
    it("matches books whose user_shelves contains the shelf name", () => {
      const books = [makeBook({ user_shelves: "favorites" }), makeBook({ user_shelves: "read" })];
      const { matches } = applyFilters(books, { shelf_name: "favorites" });
      expect(matches).toHaveLength(1);
    });

    it("is case-insensitive", () => {
      const books = [makeBook({ user_shelves: "FAVORITES" })];
      const { matches } = applyFilters(books, { shelf_name: "favorites" });
      expect(matches).toHaveLength(1);
    });

    it("uses substring matching — 'read' matches 'to-read'", () => {
      // This documents the current behavior: "read" is a substring of "to-read"
      const books = [makeBook({ user_shelves: "to-read" })];
      const { matches } = applyFilters(books, { shelf_name: "read" });
      expect(matches).toHaveLength(1);
    });

    it("excludes books not on the shelf", () => {
      const books = [makeBook({ user_shelves: "read" })];
      const { matches } = applyFilters(books, { shelf_name: "currently-reading" });
      expect(matches).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // read
  // ---------------------------------------------------------------------------

  describe("read", () => {
    it("read: true includes books with a user_read_at date", () => {
      const books = [
        makeBook({ user_read_at: "Sat Jan 01 00:00:00 -0500 2022" }),
        makeBook({ user_read_at: "" }),
      ];
      const { matches } = applyFilters(books, { read: true });
      expect(matches).toHaveLength(1);
      expect(matches[0].user_read_at).not.toBe("");
    });

    it("read: false includes books without a user_read_at date", () => {
      const books = [
        makeBook({ user_read_at: "Sat Jan 01 00:00:00 -0500 2022" }),
        makeBook({ user_read_at: "" }),
      ];
      const { matches } = applyFilters(books, { read: false });
      expect(matches).toHaveLength(1);
      expect(matches[0].user_read_at).toBe("");
    });

    it("read: undefined applies no filter", () => {
      const books = [
        makeBook({ user_read_at: "2022-01-01" }),
        makeBook({ user_read_at: "" }),
      ];
      const { matches } = applyFilters(books, {});
      expect(matches).toHaveLength(2);
    });
  });

  // ---------------------------------------------------------------------------
  // min_year_published / max_year_published
  // ---------------------------------------------------------------------------

  describe("min_year_published", () => {
    it("includes books published at or after the minimum year", () => {
      const books = [
        makeBook({ book_published: "2000" }),
        makeBook({ book_published: "2019" }),
      ];
      const { matches } = applyFilters(books, { min_year_published: 2000 });
      expect(matches).toHaveLength(2);
    });

    it("excludes books published before the minimum year", () => {
      const books = [makeBook({ book_published: "1999" }), makeBook({ book_published: "1984" })];
      const { matches } = applyFilters(books, { min_year_published: 2000 });
      expect(matches).toHaveLength(0);
    });

    it("excludes books with empty book_published (NaN)", () => {
      const books = [makeBook({ book_published: "" })];
      const { matches } = applyFilters(books, { min_year_published: 2000 });
      expect(matches).toHaveLength(0);
    });
  });

  describe("max_year_published", () => {
    it("includes books published at or before the maximum year", () => {
      const books = [makeBook({ book_published: "1984" }), makeBook({ book_published: "2000" })];
      const { matches } = applyFilters(books, { max_year_published: 2000 });
      expect(matches).toHaveLength(2);
    });

    it("excludes books published after the maximum year", () => {
      const books = [makeBook({ book_published: "2001" })];
      const { matches } = applyFilters(books, { max_year_published: 2000 });
      expect(matches).toHaveLength(0);
    });
  });

  describe("min_year + max_year together", () => {
    it("keeps only books in the year range", () => {
      const books = [
        makeBook({ book_published: "1999" }),
        makeBook({ book_published: "2000" }),
        makeBook({ book_published: "2005" }),
        makeBook({ book_published: "2011" }),
      ];
      const { matches } = applyFilters(books, { min_year_published: 2000, max_year_published: 2010 });
      expect(matches).toHaveLength(2);
    });
  });

  // ---------------------------------------------------------------------------
  // author
  // ---------------------------------------------------------------------------

  describe("author", () => {
    it("matches author name case-insensitively", () => {
      const books = [makeBook({ author_name: "J.R.R. Tolkien" })];
      const { matches } = applyFilters(books, { author: "tolkien" });
      expect(matches).toHaveLength(1);
    });

    it("uses substring matching", () => {
      const books = [
        makeBook({ author_name: "David Thomas" }),
        makeBook({ author_name: "Dylan Thomas" }),
        makeBook({ author_name: "George Orwell" }),
      ];
      const { matches } = applyFilters(books, { author: "thomas" });
      expect(matches).toHaveLength(2);
    });

    it("excludes books not matching the author", () => {
      const books = [makeBook({ author_name: "George Orwell" })];
      const { matches } = applyFilters(books, { author: "tolkien" });
      expect(matches).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Compound filters (AND logic)
  // ---------------------------------------------------------------------------

  describe("compound filters", () => {
    it("ANDs multiple filters together", () => {
      const books = [
        makeBook({ user_rating: "5", author_name: "J.R.R. Tolkien", book_published: "1954" }),
        makeBook({ user_rating: "5", author_name: "George Orwell", book_published: "1949" }),
        makeBook({ user_rating: "3", author_name: "J.R.R. Tolkien", book_published: "1954" }),
      ];
      const { matches } = applyFilters(books, { min_rating: 4, author: "tolkien" });
      expect(matches).toHaveLength(1);
      expect(matches[0].author_name).toBe("J.R.R. Tolkien");
      expect(matches[0].user_rating).toBe("5");
    });

    it("returns all books when no filters are applied", () => {
      const books = [makeBook(), makeBook(), makeBook()];
      const { matches } = applyFilters(books, {});
      expect(matches).toHaveLength(3);
    });

    it("returns empty when no books match all filters", () => {
      const books = [makeBook({ user_rating: "2", book_published: "1984" })];
      const { matches } = applyFilters(books, { min_rating: 4, min_year_published: 2000 });
      expect(matches).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // filters_applied tracking
  // ---------------------------------------------------------------------------

  describe("filters_applied", () => {
    it("is empty when no filters are passed", () => {
      const { filters_applied } = applyFilters([makeBook()], {});
      expect(filters_applied).toEqual([]);
    });

    it("tracks each active filter", () => {
      const { filters_applied } = applyFilters(
        [makeBook()],
        { min_rating: 1, max_rating: 5, author: "test" }
      );
      expect(filters_applied).toContain("min_rating");
      expect(filters_applied).toContain("max_rating");
      expect(filters_applied).toContain("author");
    });

    it("does not duplicate filter names across multiple books", () => {
      const books = [makeBook(), makeBook(), makeBook()];
      const { filters_applied } = applyFilters(books, { min_rating: 1 });
      expect(filters_applied.filter((f) => f === "min_rating")).toHaveLength(1);
    });

    it("tracks only the filters that were actually specified", () => {
      const { filters_applied } = applyFilters([makeBook()], { shelf_name: "read" });
      expect(filters_applied).toEqual(["shelf_name"]);
    });
  });
});

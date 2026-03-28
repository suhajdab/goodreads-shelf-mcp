import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { stripHtml, parseItem, fetchPage, fetchPages } from "../src/goodreads.js";
import { makeRssXml, makeEmptyRssXml, makeItemXml, makeNBooksXml } from "./fixtures/xml.js";

// ---------------------------------------------------------------------------
// stripHtml
// ---------------------------------------------------------------------------

describe("stripHtml", () => {
  it("returns empty string for empty input", () => {
    expect(stripHtml("")).toBe("");
  });

  it("returns empty string for falsy input", () => {
    expect(stripHtml(null as unknown as string)).toBe("");
    expect(stripHtml(undefined as unknown as string)).toBe("");
  });

  it("strips basic HTML tags", () => {
    expect(stripHtml("<p>Hello</p>")).toBe("Hello");
  });

  it("strips nested tags", () => {
    expect(stripHtml("<p><b>bold</b> text</p>")).toBe("bold text");
  });

  it("converts <br> to newline", () => {
    expect(stripHtml("line1<br>line2")).toBe("line1\nline2");
  });

  it("converts self-closing <br/> to newline", () => {
    expect(stripHtml("line1<br/>line2")).toBe("line1\nline2");
  });

  it("converts <br /> with space to newline (case-insensitive)", () => {
    expect(stripHtml("line1<BR />line2")).toBe("line1\nline2");
  });

  it("decodes &amp;", () => {
    expect(stripHtml("cats &amp; dogs")).toBe("cats & dogs");
  });

  it("decodes &lt; and &gt;", () => {
    expect(stripHtml("&lt;tag&gt;")).toBe("<tag>");
  });

  it("decodes &quot;", () => {
    expect(stripHtml("say &quot;hello&quot;")).toBe('say "hello"');
  });

  it("decodes &#39;", () => {
    expect(stripHtml("it&#39;s")).toBe("it's");
  });

  it("decodes &nbsp; to space", () => {
    expect(stripHtml("non&nbsp;breaking")).toBe("non breaking");
  });

  it("trims outer whitespace", () => {
    expect(stripHtml("  hello  ")).toBe("hello");
  });

  it("strips script tags and their content text", () => {
    // Tags are removed but text content between tags remains
    expect(stripHtml("<script>evil()</script>safe")).toBe("evil()safe");
  });

  it("handles mixed HTML and entities", () => {
    expect(stripHtml("<b>cats</b> &amp; <i>dogs</i>")).toBe("cats & dogs");
  });

  it("returns plain text unchanged (after trim)", () => {
    expect(stripHtml("plain text")).toBe("plain text");
  });
});

// ---------------------------------------------------------------------------
// parseItem
// ---------------------------------------------------------------------------

describe("parseItem", () => {
  it("returns all empty strings for empty object", () => {
    const book = parseItem({});
    expect(book.title).toBe("");
    expect(book.author_name).toBe("");
    expect(book.book_id).toBe("");
    expect(book.num_pages).toBe("");
  });

  it("trims string values", () => {
    const book = parseItem({ title: "  Dune  ", author_name: "  Frank Herbert  " });
    expect(book.title).toBe("Dune");
    expect(book.author_name).toBe("Frank Herbert");
  });

  it("coerces non-string values to string", () => {
    const book = parseItem({ book_id: 123, user_rating: 5 });
    expect(book.book_id).toBe("123");
    expect(book.user_rating).toBe("5");
  });

  it("reads num_pages from nested book object", () => {
    const book = parseItem({ book: { num_pages: "412" } });
    expect(book.num_pages).toBe("412");
  });

  it("prefers book.num_pages over top-level num_pages", () => {
    const book = parseItem({ num_pages: "100", book: { num_pages: "412" } });
    expect(book.num_pages).toBe("412");
  });

  it("falls back to top-level num_pages when no book object", () => {
    const book = parseItem({ num_pages: "300" });
    expect(book.num_pages).toBe("300");
  });

  it("strips HTML from user_review", () => {
    const book = parseItem({ user_review: "<p>Great read!</p>" });
    expect(book.user_review).toBe("Great read!");
  });

  it("strips HTML from book_description", () => {
    const book = parseItem({ book_description: "a &amp; b" });
    expect(book.book_description).toBe("a & b");
  });

  it("maps all fields correctly", () => {
    const item = {
      book_id: "42",
      title: "Test",
      author_name: "Author",
      isbn: "123",
      book_published: "2000",
      average_rating: "3.5",
      user_rating: "4",
      user_read_at: "2023-01-01",
      user_date_added: "2023-01-02",
      user_date_created: "2023-01-03",
      user_shelves: "read favorites",
      user_review: "Good",
      link: "https://goodreads.com/book/42",
      book_image_url: "https://img.url",
      book_description: "A book",
      book: { num_pages: "250" },
    };
    const book = parseItem(item);
    expect(book.book_id).toBe("42");
    expect(book.title).toBe("Test");
    expect(book.num_pages).toBe("250");
    expect(book.user_shelves).toBe("read favorites");
  });
});

// ---------------------------------------------------------------------------
// fetchPage
// ---------------------------------------------------------------------------

describe("fetchPage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function mockFetch(xml: string, ok = true) {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok,
      status: ok ? 200 : 403,
      statusText: ok ? "OK" : "Forbidden",
      text: async () => xml,
    } as Response);
  }

  it("returns empty array for empty shelf", async () => {
    mockFetch(makeEmptyRssXml());
    const books = await fetchPage("user1", "key1", "%23ALL%23", 1);
    expect(books).toEqual([]);
  });

  it("returns array with one book for single item feed", async () => {
    mockFetch(makeRssXml([makeItemXml({ title: "Solo Book", book_id: "99" })]));
    const books = await fetchPage("user1", "key1", "%23ALL%23", 1);
    expect(books).toHaveLength(1);
    expect(books[0].title).toBe("Solo Book");
    expect(books[0].book_id).toBe("99");
  });

  it("returns multiple books for multi-item feed", async () => {
    mockFetch(makeNBooksXml(3));
    const books = await fetchPage("user1", "key1", "%23ALL%23", 1);
    expect(books).toHaveLength(3);
    expect(books[0].title).toBe("Book 1");
    expect(books[2].title).toBe("Book 3");
  });

  it("throws on non-ok HTTP response", async () => {
    mockFetch("", false);
    await expect(fetchPage("user1", "key1", "%23ALL%23", 1)).rejects.toThrow(
      "Failed to fetch RSS feed: 403 Forbidden"
    );
  });

  it("constructs the correct URL", async () => {
    mockFetch(makeEmptyRssXml());
    await fetchPage("userId123", "myKey", "to-read", 3);
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      "https://www.goodreads.com/review/list_rss/userId123?key=myKey&shelf=to-read&page=3"
    );
  });

  it("returns 100 books when feed has 100 items", async () => {
    mockFetch(makeNBooksXml(100));
    const books = await fetchPage("user1", "key1", "%23ALL%23", 1);
    expect(books).toHaveLength(100);
  });
});

// ---------------------------------------------------------------------------
// fetchPages
// ---------------------------------------------------------------------------

describe("fetchPages", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function mockFetchWith(...pageSizes: number[]) {
    for (const size of pageSizes) {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        text: async () => makeNBooksXml(size),
      } as Response);
    }
  }

  it("stops early when first page has fewer than 100 books", async () => {
    mockFetchWith(50);
    const { books, pagesRead } = await fetchPages("u", "k", "s", 1, 10);
    expect(books).toHaveLength(50);
    expect(pagesRead).toBe(1);
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
  });

  it("stops early when second page has fewer than 100 books", async () => {
    mockFetchWith(100, 40);
    const { books, pagesRead } = await fetchPages("u", "k", "s", 1, 10);
    expect(books).toHaveLength(140);
    expect(pagesRead).toBe(2);
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2);
  });

  it("respects maxPages cap even if all pages are full", async () => {
    mockFetchWith(100, 100);
    const { books, pagesRead } = await fetchPages("u", "k", "s", 1, 2);
    expect(books).toHaveLength(200);
    expect(pagesRead).toBe(2);
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2);
  });

  it("concatenates books across pages", async () => {
    mockFetchWith(100, 3);
    const { books } = await fetchPages("u", "k", "s", 1, 10);
    expect(books).toHaveLength(103);
    expect(books[0].title).toBe("Book 1");
    expect(books[100].title).toBe("Book 1"); // first book of page 2 resets to index 1
  });

  it("handles empty first page", async () => {
    mockFetchWith(0);
    const { books, pagesRead } = await fetchPages("u", "k", "s", 1, 10);
    expect(books).toHaveLength(0);
    expect(pagesRead).toBe(1);
  });

  it("starts fetching from the specified startPage", async () => {
    mockFetchWith(5);
    await fetchPages("u", "k", "s", 3, 5);
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      expect.stringContaining("page=3")
    );
  });
});

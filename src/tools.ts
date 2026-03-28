import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { fetchPage, fetchPages, type Book } from "./goodreads.js";

const paginationSchema = {
  page: z.number().int().min(1).default(1).describe("Page number (100 books per page)"),
  all_pages: z.boolean().default(false).describe("Fetch all pages instead of a single page"),
  max_pages: z.number().int().min(1).max(50).default(10).describe("Max pages to fetch when all_pages is true"),
};

export async function getBooks(
  userId: string,
  key: string,
  shelf: string,
  page: number,
  allPages: boolean,
  maxPages: number
): Promise<{ books: Book[]; total: number; page: number; has_more: boolean }> {
  if (allPages) {
    const { books, pagesRead } = await fetchPages(userId, key, shelf, 1, maxPages);
    return { books, total: books.length, page: pagesRead, has_more: false };
  }

  const books = await fetchPage(userId, key, shelf, page);
  return { books, total: books.length, page, has_more: books.length === 100 };
}

export function searchBooks(books: Book[], query: string): Book[] {
  const q = query.toLowerCase();
  return books.filter(
    (b) => b.title.toLowerCase().includes(q) || b.author_name.toLowerCase().includes(q)
  );
}

export interface FilterParams {
  min_rating?: number;
  max_rating?: number;
  min_average_rating?: number;
  shelf_name?: string;
  read?: boolean;
  min_year_published?: number;
  max_year_published?: number;
  author?: string;
}

export function applyFilters(
  books: Book[],
  params: FilterParams
): { matches: Book[]; filters_applied: string[] } {
  const filtersApplied: string[] = [];

  const matches = books.filter((b) => {
    const rating = parseFloat(b.user_rating);
    const avgRating = parseFloat(b.average_rating);
    const year = parseInt(b.book_published, 10);

    if (params.min_rating !== undefined) {
      filtersApplied.includes("min_rating") || filtersApplied.push("min_rating");
      if (isNaN(rating) || rating < params.min_rating) return false;
    }
    if (params.max_rating !== undefined) {
      filtersApplied.includes("max_rating") || filtersApplied.push("max_rating");
      if (isNaN(rating) || rating > params.max_rating) return false;
    }
    if (params.min_average_rating !== undefined) {
      filtersApplied.includes("min_average_rating") || filtersApplied.push("min_average_rating");
      if (isNaN(avgRating) || avgRating < params.min_average_rating) return false;
    }
    if (params.shelf_name !== undefined) {
      filtersApplied.includes("shelf_name") || filtersApplied.push("shelf_name");
      if (!b.user_shelves.toLowerCase().includes(params.shelf_name.toLowerCase())) return false;
    }
    if (params.read !== undefined) {
      filtersApplied.includes("read") || filtersApplied.push("read");
      const hasReadDate = b.user_read_at !== "";
      if (params.read !== hasReadDate) return false;
    }
    if (params.min_year_published !== undefined) {
      filtersApplied.includes("min_year_published") || filtersApplied.push("min_year_published");
      if (isNaN(year) || year < params.min_year_published) return false;
    }
    if (params.max_year_published !== undefined) {
      filtersApplied.includes("max_year_published") || filtersApplied.push("max_year_published");
      if (isNaN(year) || year > params.max_year_published) return false;
    }
    if (params.author !== undefined) {
      filtersApplied.includes("author") || filtersApplied.push("author");
      if (!b.author_name.toLowerCase().includes(params.author.toLowerCase())) return false;
    }
    return true;
  });

  return { matches, filters_applied: [...new Set(filtersApplied)] };
}

export function registerTools(
  server: McpServer,
  userId: string,
  key: string,
  shelf: string
) {
  server.tool(
    "get_books",
    "Get books from the configured Goodreads shelf with pagination. Returns 100 books per page.",
    paginationSchema,
    async ({ page, all_pages, max_pages }) => {
      const result = await getBooks(userId, key, shelf, page, all_pages, max_pages);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "search_books",
    "Search books on the Goodreads shelf by title or author name (case-insensitive).",
    {
      query: z.string().describe("Search term to match against title and author"),
      ...paginationSchema,
    },
    async ({ query, page, all_pages, max_pages }) => {
      const { books } = await getBooks(userId, key, shelf, page, all_pages, max_pages);
      const matches = searchBooks(books, query);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              { books: matches, total_matches: matches.length, searched_count: books.length },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.tool(
    "filter_books",
    "Filter books on the Goodreads shelf by rating, year, author, shelf, or read status.",
    {
      min_rating: z.number().min(0).max(5).optional().describe("Minimum user rating (0-5)"),
      max_rating: z.number().min(0).max(5).optional().describe("Maximum user rating (0-5)"),
      min_average_rating: z.number().min(0).max(5).optional().describe("Minimum Goodreads average rating"),
      shelf_name: z.string().optional().describe("Filter by shelf name (e.g. 'to-read', 'read')"),
      read: z.boolean().optional().describe("true = only read books, false = only unread"),
      min_year_published: z.number().int().optional().describe("Minimum publication year"),
      max_year_published: z.number().int().optional().describe("Maximum publication year"),
      author: z.string().optional().describe("Filter by author name (case-insensitive partial match)"),
      ...paginationSchema,
    },
    async (params) => {
      const { books } = await getBooks(userId, key, shelf, params.page, params.all_pages, params.max_pages);
      const { matches, filters_applied } = applyFilters(books, params);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                books: matches,
                total_matches: matches.length,
                searched_count: books.length,
                filters_applied,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );
}

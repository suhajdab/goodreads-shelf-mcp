import { XMLParser } from "fast-xml-parser";

export interface Book {
  book_id: string;
  title: string;
  author_name: string;
  isbn: string;
  book_published: string;
  average_rating: string;
  user_rating: string;
  user_read_at: string;
  user_date_added: string;
  user_date_created: string;
  user_shelves: string;
  user_review: string;
  num_pages: string;
  link: string;
  book_image_url: string;
  book_description: string;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  trimValues: true,
});

export function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

export function parseItem(item: Record<string, unknown>): Book {
  const str = (val: unknown): string => {
    if (val === null || val === undefined) return "";
    return String(val).trim();
  };

  return {
    book_id: str(item.book_id),
    title: str(item.title),
    author_name: str(item.author_name),
    isbn: str(item.isbn),
    book_published: str(item.book_published),
    average_rating: str(item.average_rating),
    user_rating: str(item.user_rating),
    user_read_at: str(item.user_read_at),
    user_date_added: str(item.user_date_added),
    user_date_created: str(item.user_date_created),
    user_shelves: str(item.user_shelves),
    user_review: stripHtml(str(item.user_review)),
    num_pages: str((item as Record<string, Record<string, unknown>>).book?.num_pages ?? item.num_pages ?? ""),
    link: str(item.link),
    book_image_url: str(item.book_image_url),
    book_description: stripHtml(str(item.book_description)),
  };
}

export async function fetchPage(
  userId: string,
  key: string,
  shelf: string,
  page: number
): Promise<Book[]> {
  const url = `https://www.goodreads.com/review/list_rss/${userId}?key=${key}&shelf=${shelf}&page=${page}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch RSS feed: ${response.status} ${response.statusText}`);
  }

  const xml = await response.text();
  const parsed = parser.parse(xml);

  const items = parsed?.rss?.channel?.item;
  if (!items) return [];

  const itemArray = Array.isArray(items) ? items : [items];
  return itemArray.map(parseItem);
}

export async function fetchPages(
  userId: string,
  key: string,
  shelf: string,
  startPage: number,
  maxPages: number
): Promise<{ books: Book[]; pagesRead: number }> {
  const allBooks: Book[] = [];
  let pagesRead = 0;

  for (let page = startPage; page < startPage + maxPages; page++) {
    const books = await fetchPage(userId, key, shelf, page);
    pagesRead++;
    allBooks.push(...books);

    if (books.length < 100) break;
  }

  return { books: allBooks, pagesRead };
}

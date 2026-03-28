export function makeItemXml(fields: Record<string, string> = {}): string {
  const f = (key: string, fallback: string) => fields[key] ?? fallback;
  return `<item>
    <book_id>${f("book_id", "1")}</book_id>
    <title>${f("title", "Test Book")}</title>
    <author_name>${f("author_name", "Test Author")}</author_name>
    <isbn>${f("isbn", "")}</isbn>
    <book_published>${f("book_published", "2020")}</book_published>
    <average_rating>${f("average_rating", "4.00")}</average_rating>
    <user_rating>${f("user_rating", "4")}</user_rating>
    <user_read_at>${f("user_read_at", "")}</user_read_at>
    <user_date_added>${f("user_date_added", "")}</user_date_added>
    <user_date_created>${f("user_date_created", "")}</user_date_created>
    <user_shelves>${f("user_shelves", "read")}</user_shelves>
    <user_review>${f("user_review", "")}</user_review>
    <num_pages>${f("num_pages", "200")}</num_pages>
    <link>${f("link", "https://www.goodreads.com/book/show/1")}</link>
    <book_image_url>${f("book_image_url", "")}</book_image_url>
    <book_description>${f("book_description", "")}</book_description>
  </item>`;
}

export function makeRssXml(itemXmls: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Test Shelf</title>
    ${itemXmls.join("\n    ")}
  </channel>
</rss>`;
}

export function makeEmptyRssXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Empty Shelf</title>
  </channel>
</rss>`;
}

export function makeNBooksXml(n: number): string {
  const items = Array.from({ length: n }, (_, i) =>
    makeItemXml({ book_id: String(i + 1), title: `Book ${i + 1}` })
  );
  return makeRssXml(items);
}

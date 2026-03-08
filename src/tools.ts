import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { HardcoverClient } from "./hardcover-client.js";

const TOOL_OUTPUT_SCHEMA = z.object({
  data: z.unknown(),
});

const searchTypeSchema = z.enum([
  "all",
  "books",
  "authors",
  "users",
  "lists",
  "publishers",
  "characters",
  "series",
  "prompts",
]);

const libraryStatusSchema = z.enum([
  "want_to_read",
  "currently_reading",
  "read",
  "paused",
  "did_not_finish",
  "ignored",
]);
const libraryStatusFilterSchema = z.union([
  libraryStatusSchema,
  z.array(libraryStatusSchema).max(4),
]);

const listPrivacySchema = z.enum(["public", "followers_only", "private"]);
const activityFeedModeSchema = z.enum(["for_you", "global", "user"]);
const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.");

const toolAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
};

const writeAnnotations = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: true,
};

const idempotentWriteAnnotations = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
};

const destructiveAnnotations = {
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: false,
  openWorldHint: true,
};

type JsonRecord = Record<string, unknown>;

interface SearchResponse {
  search: {
    ids?: unknown;
    page?: number;
    per_page?: number;
    query?: string;
    query_type?: string;
    results?: {
      found?: number;
      hits?: Array<{
        document?: unknown;
      }>;
    };
  };
}

interface BooksResponse {
  books: unknown[];
}

interface AuthorsResponse {
  authors: unknown[];
}

interface EditionsResponse {
  editions: unknown[];
}

interface UsersResponse {
  users: unknown[];
}

interface MeResponse {
  me: unknown;
}

interface ListsResponse {
  lists: unknown[];
}

interface UserBooksResponse {
  user_books: unknown[];
}

interface ListBooksResponse {
  list_books: unknown[];
}

interface PromptsResponse {
  prompts: unknown[];
}

interface PromptAnswersResponse {
  prompt_answers: unknown[];
}

interface PublishersResponse {
  publishers: unknown[];
}

interface CharactersResponse {
  characters: unknown[];
}

interface SeriesResponse {
  series: unknown[];
}

interface ActivitiesResponse {
  activities: unknown[];
}

interface ActivityForYouFeedResponse {
  activity_foryou_feed: unknown[];
}

const SEARCH_QUERY = /* GraphQL */ `
  query Search($query: String!, $queryType: String!, $perPage: Int!, $page: Int!) {
    search(
      query: $query
      query_type: $queryType
      per_page: $perPage
      page: $page
    ) {
      ids
      page
      per_page
      query
      query_type
      results
    }
  }
`;

const BOOK_FIELDS = /* GraphQL */ `
  id
  slug
  title
  subtitle
  description
  pages
  rating
  release_date
  release_year
  cached_contributors
  users_count
  users_read_count
  ratings_count
  reviews_count
  lists_count
  contributions {
    author {
      id
      name
      slug
    }
  }
`;

const EDITION_FIELDS = /* GraphQL */ `
  id
  title
  subtitle
  isbn_13
  isbn_10
  asin
  pages
  audio_seconds
  release_date
  release_year
  edition_information
  physical_format
  edition_format
  rating
  users_count
  users_read_count
  lists_count
  state
  publisher {
    id
    name
    slug
  }
  language {
    language
  }
  reading_format {
    format
  }
  book {
    id
    slug
    title
    cached_contributors
    rating
    release_year
  }
`;

const AUTHOR_FIELDS = /* GraphQL */ `
  id
  slug
  name
  bio
  books_count
  born_date
  born_year
  death_date
  death_year
  is_bipoc
  is_lgbtq
  contributions(limit: $booksLimit, order_by: { created_at: desc }) {
    contribution
    book {
      id
      slug
      title
      rating
      release_year
    }
  }
`;

const USER_FIELDS = /* GraphQL */ `
  id
  username
  name
  location
  flair
  pro
  books_count
  followers_count
  followed_users_count
  sign_in_count
  pronoun_personal
  pronoun_possessive
`;

const PUBLISHER_FIELDS = /* GraphQL */ `
  id
  slug
  name
  editions_count
  state
  created_at
  updated_at
  parent_publisher {
    id
    slug
    name
  }
  editions(limit: $editionsLimit, order_by: { release_date: desc }) {
    id
    title
    release_date
    release_year
    physical_format
    book {
      id
      slug
      title
      cached_contributors
      rating
      release_year
    }
  }
`;

const CHARACTER_FIELDS = /* GraphQL */ `
  id
  slug
  name
  biography
  books_count
  canonical_books_count
  openlibrary_url
  is_lgbtq
  is_poc
  has_disability
  state
  canonical {
    id
    slug
    name
  }
  book_characters(limit: $booksLimit, order_by: { id: asc }) {
    id
    only_mentioned
    spoiler
    book {
      id
      slug
      title
      cached_contributors
      rating
      release_year
    }
  }
`;

const SERIES_FIELDS = /* GraphQL */ `
  id
  slug
  name
  description
  books_count
  primary_books_count
  is_completed
  identifiers
  state
  author {
    id
    slug
    name
  }
  creator {
    id
    username
    name
  }
  book_series(limit: $booksLimit, order_by: { position: asc_nulls_last }) {
    id
    position
    featured
    book {
      id
      slug
      title
      cached_contributors
      rating
      release_year
    }
  }
`;

const ACTIVITY_FIELDS = /* GraphQL */ `
  id
  uid
  event
  created_at
  user_id
  book_id
  original_book_id
  object_type
  privacy_setting_id
  likes_count
  data
  privacy_setting {
    id
    setting
  }
  user {
    id
    username
    name
  }
  book {
    id
    slug
    title
    release_year
  }
`;

const LIST_FIELDS = /* GraphQL */ `
  id
  slug
  name
  description
  public
  privacy_setting_id
  privacy_setting {
    id
    setting
  }
  books_count
  likes_count
  created_at
  updated_at
  user {
    id
    username
    name
  }
`;

const LIST_BOOK_FIELDS = /* GraphQL */ `
  id
  list_id
  book_id
  edition_id
  position
  reason
  created_at
  updated_at
  book {
    id
    slug
    title
    cached_contributors
    rating
    release_year
  }
  edition {
    id
    title
    isbn_13
    physical_format
  }
`;

const USER_BOOK_FIELDS = /* GraphQL */ `
  id
  book_id
  edition_id
  status_id
  rating
  read_count
  date_added
  first_started_reading_date
  last_read_date
  privacy_setting_id
  has_review
  private_notes
  review
  review_html
  review_length
  review_object
  review_raw
  review_slate
  review_has_spoilers
  reviewed_at
  book {
    id
    slug
    title
    cached_contributors
    rating
    release_year
  }
  edition {
    id
    title
    isbn_13
    physical_format
  }
  privacy_setting {
    id
    setting
  }
  user_book_reads(order_by: { id: desc }) {
    id
    started_at
    finished_at
    edition_id
    progress_pages
    progress_seconds
  }
`;

const PROMPT_FIELDS = /* GraphQL */ `
  id
  slug
  question
  description
  answers_count
  books_count
  users_count
  privacy_setting_id
  privacy_setting {
    id
    setting
  }
  user {
    id
    username
    name
  }
`;

const PROMPT_ANSWER_FIELDS = /* GraphQL */ `
  id
  prompt_id
  book_id
  description
  created_at
  book {
    id
    slug
    title
    cached_contributors
    rating
    release_year
  }
  prompt {
    id
    slug
    question
  }
`;

const USER_BOOK_READ_FIELDS = /* GraphQL */ `
  id
  user_book_id
  edition_id
  started_at
  finished_at
  progress_pages
  progress_seconds
`;

function makeTextResult(label: string, data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: `${label}\n${JSON.stringify(data, null, 2)}`,
      },
    ],
    structuredContent: {
      data,
    },
  };
}

function makeSearchResult(
  query: string,
  type: z.infer<typeof searchTypeSchema>,
  page: number,
  limit: number,
  items: unknown[],
  found: number,
  source: "hardcover-search" | "graphql",
) {
  return {
    found,
    items,
    page,
    per_page: limit,
    query,
    query_type: type,
    source,
  };
}

function summarizeBookDocument(document: Record<string, unknown>) {
  return {
    id: document.id ?? null,
    slug: document.slug ?? null,
    title: document.title ?? null,
    subtitle: document.subtitle ?? null,
    description: document.description ?? null,
    author_names: document.author_names ?? [],
    release_year: document.release_year ?? null,
    rating: document.rating ?? null,
    ratings_count: document.ratings_count ?? null,
    users_count: document.users_count ?? null,
    users_read_count: document.users_read_count ?? null,
    lists_count: document.lists_count ?? null,
    image: document.image ?? null,
  };
}

function summarizeAuthorDocument(document: Record<string, unknown>) {
  return {
    id: document.id ?? null,
    slug: document.slug ?? null,
    name: document.name ?? null,
    name_personal: document.name_personal ?? null,
    books_count: document.books_count ?? null,
    books: document.books ?? [],
    series_names: document.series_names ?? [],
    image: document.image ?? null,
  };
}

function summarizeUserDocument(document: Record<string, unknown>) {
  return {
    id: document.id ?? null,
    username: document.username ?? null,
    name: document.name ?? null,
    location: document.location ?? null,
    pro: document.pro ?? null,
    books_count: document.books_count ?? null,
    followers_count: document.followers_count ?? null,
    followed_users_count: document.followed_users_count ?? null,
    image: document.image ?? null,
  };
}

function summarizeListDocument(document: Record<string, unknown>) {
  return {
    id: document.id ?? null,
    slug: document.slug ?? null,
    name: document.name ?? null,
    books_count: document.books_count ?? null,
    likes_count: document.likes_count ?? null,
    followers_count: document.followers_count ?? null,
    books: document.books ?? [],
    user: document.user ?? null,
  };
}

function summarizePublisherDocument(document: Record<string, unknown>) {
  return {
    id: document.id ?? null,
    slug: document.slug ?? null,
    name: document.name ?? null,
    editions_count: document.editions_count ?? null,
    object_type: document.object_type ?? null,
  };
}

function summarizeCharacterDocument(document: Record<string, unknown>) {
  return {
    id: document.id ?? null,
    slug: document.slug ?? null,
    name: document.name ?? null,
    books_count: document.books_count ?? null,
    books: document.books ?? [],
    author_names: document.author_names ?? [],
    object_type: document.object_type ?? null,
  };
}

function summarizeSeriesDocument(document: Record<string, unknown>) {
  return {
    id: document.id ?? null,
    slug: document.slug ?? null,
    name: document.name ?? null,
    author_name: document.author_name ?? null,
    books_count: document.books_count ?? null,
    primary_books_count: document.primary_books_count ?? null,
    readers_count: document.readers_count ?? null,
    books: document.books ?? [],
  };
}

function summarizePromptDocument(document: Record<string, unknown>) {
  return {
    id: document.id ?? null,
    slug: document.slug ?? null,
    question: document.question ?? null,
    books_count: document.books_count ?? null,
    answers_count: document.answers_count ?? null,
    users_count: document.users_count ?? null,
    books: document.books ?? [],
    user: document.user ?? null,
  };
}

function mapSearchQueryType(type: z.infer<typeof searchTypeSchema>): string {
  switch (type) {
    case "authors":
      return "author";
    case "users":
      return "user";
    case "lists":
      return "list";
    case "publishers":
      return "publisher";
    case "characters":
      return "character";
    case "prompts":
      return "prompt";
    default:
      return type;
  }
}

function summarizeSearchPayload(
  search: SearchResponse["search"],
  type: z.infer<typeof searchTypeSchema>,
) {
  const hits = search.results?.hits ?? [];

  const items = hits
    .map((hit) => hit.document)
    .filter((document): document is Record<string, unknown> => Boolean(document))
    .map((document) => {
      switch (type) {
        case "authors":
          return summarizeAuthorDocument(document);
        case "users":
          return summarizeUserDocument(document);
        case "lists":
          return summarizeListDocument(document);
        case "publishers":
          return summarizePublisherDocument(document);
        case "characters":
          return summarizeCharacterDocument(document);
        case "series":
          return summarizeSeriesDocument(document);
        case "prompts":
          return summarizePromptDocument(document);
        case "all":
        case "books":
        default:
          return summarizeBookDocument(document);
      }
    });

  return makeSearchResult(
    search.query ?? "",
    type,
    search.page ?? 1,
    search.per_page ?? hits.length,
    items,
    search.results?.found ?? items.length,
    "hardcover-search",
  );
}

function normalizeMe<T>(me: T | T[] | null | undefined): T | null {
  if (Array.isArray(me)) {
    return me[0] ?? null;
  }

  return me ?? null;
}

function pickDefined<T extends Record<string, unknown>>(input: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

function requireAtLeastOneDefined(
  values: Array<[name: string, value: unknown]>,
  message: string,
): void {
  if (!values.some(([, value]) => value !== undefined && value !== null)) {
    throw new Error(message);
  }
}

function requireSingleSelector(
  selectors: Array<[name: string, value: unknown]>,
): [string, string | number | boolean] {
  const defined = selectors.filter(([, value]) => value !== undefined && value !== null);

  if (defined.length !== 1) {
    throw new Error(
      `Exactly one selector is required: ${selectors.map(([name]) => name).join(", ")}.`,
    );
  }

  const [name, value] = defined[0]!;

  if (
    typeof value !== "string" &&
    typeof value !== "number" &&
    typeof value !== "boolean"
  ) {
    throw new Error(`Invalid selector value for ${name}.`);
  }

  return [name, value];
}

function buildBookWhere(args: {
  id?: number | undefined;
  slug?: string | undefined;
}): JsonRecord {
  if (args.id !== undefined) {
    return { id: { _eq: args.id } };
  }

  if (args.slug) {
    return { slug: { _eq: args.slug } };
  }

  throw new Error("Either id or slug is required.");
}

function buildAuthorWhere(args: {
  id?: number | undefined;
  slug?: string | undefined;
  name?: string | undefined;
}): JsonRecord {
  if (args.id !== undefined) {
    return { id: { _eq: args.id } };
  }

  if (args.slug) {
    return { slug: { _eq: args.slug } };
  }

  if (args.name) {
    return { name: { _eq: args.name } };
  }

  throw new Error("One of id, slug, or name is required.");
}

function buildEditionWhere(args: {
  id?: number | undefined;
  isbn13?: string | undefined;
  asin?: string | undefined;
}): JsonRecord {
  if (args.id !== undefined) {
    return { id: { _eq: args.id } };
  }

  if (args.isbn13) {
    return { isbn_13: { _eq: args.isbn13 } };
  }

  if (args.asin) {
    return { asin: { _eq: args.asin } };
  }

  throw new Error("One of id, isbn13, or asin is required.");
}

function buildListWhere(args: {
  id?: number | undefined;
  slug?: string | undefined;
}): JsonRecord {
  if (args.id !== undefined) {
    return { id: { _eq: args.id } };
  }

  if (args.slug) {
    return { slug: { _eq: args.slug } };
  }

  throw new Error("Either id or slug is required.");
}

function buildPublisherWhere(args: {
  id?: number | undefined;
  slug?: string | undefined;
  name?: string | undefined;
}): JsonRecord {
  if (args.id !== undefined) {
    return { id: { _eq: args.id } };
  }

  if (args.slug) {
    return { slug: { _eq: args.slug } };
  }

  if (args.name) {
    return { name: { _eq: args.name } };
  }

  throw new Error("One of id, slug, or name is required.");
}

function buildCharacterWhere(args: {
  id?: number | undefined;
  slug?: string | undefined;
  name?: string | undefined;
}): JsonRecord {
  if (args.id !== undefined) {
    return { id: { _eq: args.id } };
  }

  if (args.slug) {
    return { slug: { _eq: args.slug } };
  }

  if (args.name) {
    return { name: { _eq: args.name } };
  }

  throw new Error("One of id, slug, or name is required.");
}

function buildSeriesWhere(args: {
  id?: number | undefined;
  slug?: string | undefined;
  name?: string | undefined;
}): JsonRecord {
  if (args.id !== undefined) {
    return { id: { _eq: args.id } };
  }

  if (args.slug) {
    return { slug: { _eq: args.slug } };
  }

  if (args.name) {
    return { name: { _eq: args.name } };
  }

  throw new Error("One of id, slug, or name is required.");
}

async function resolveUserId(
  client: HardcoverClient,
  args: {
    id?: number | undefined;
    username?: string | undefined;
    me?: boolean | undefined;
  },
): Promise<number> {
  const [selector, value] = requireSingleSelector([
    ["id", args.id],
    ["username", args.username],
    ["me", args.me],
  ]);

  if (selector === "id") {
    return value as number;
  }

  if (selector === "me") {
    const response = await client.query<MeResponse>(/* GraphQL */ `
      query Me {
        me {
          id
        }
      }
    `);

    const meUser = normalizeMe(response.me as { id: number } | Array<{ id: number }>);

    if (!meUser?.id) {
      throw new Error("Authenticated Hardcover user could not be resolved.");
    }

    return meUser.id;
  }

  const response = await client.query<UsersResponse>(
    /* GraphQL */ `
      query UserIdByUsername($username: String!) {
        users(where: { username: { _eq: $username } }, limit: 1) {
          id
        }
      }
    `,
    { username: value },
  );

  const user = response.users[0] as { id?: number } | undefined;

  if (!user?.id) {
    throw new Error(`No user found for username "${value}".`);
  }

  return user.id;
}

async function resolveListId(
  client: HardcoverClient,
  args: {
    id?: number | undefined;
    slug?: string | undefined;
  },
): Promise<number> {
  const [selector, value] = requireSingleSelector([
    ["id", args.id],
    ["slug", args.slug],
  ]);

  if (selector === "id") {
    return value as number;
  }

  const response = await client.query<ListsResponse>(
    /* GraphQL */ `
      query ListIdBySlug($slug: String!) {
        lists(where: { slug: { _eq: $slug } }, limit: 1) {
          id
        }
      }
    `,
    { slug: value },
  );

  const list = response.lists[0] as { id?: number } | undefined;

  if (!list?.id) {
    throw new Error(`No list found for slug "${value}".`);
  }

  return list.id;
}

async function resolveListBookId(
  client: HardcoverClient,
  args: {
    listBookId?: number | undefined;
    listId?: number | undefined;
    bookId?: number | undefined;
  },
): Promise<number> {
  if (args.listBookId !== undefined) {
    return args.listBookId;
  }

  if (args.listId === undefined || args.bookId === undefined) {
    throw new Error("Provide listBookId or both listId and bookId.");
  }

  const response = await client.query<ListBooksResponse>(
    /* GraphQL */ `
      query ResolveListBookId($listId: Int!, $bookId: Int!) {
        list_books(
          where: {
            list_id: { _eq: $listId }
            book_id: { _eq: $bookId }
          }
          limit: 1
          order_by: { id: desc }
        ) {
          id
        }
      }
    `,
    {
      bookId: args.bookId,
      listId: args.listId,
    },
  );

  const listBook = response.list_books[0] as { id?: number } | undefined;

  if (!listBook?.id) {
    throw new Error(
      `No list entry found for list ${args.listId} and book ${args.bookId}.`,
    );
  }

  return listBook.id;
}

async function resolveUserBookId(
  client: HardcoverClient,
  args: {
    userBookId?: number | undefined;
    bookId?: number | undefined;
  },
): Promise<number> {
  if (args.userBookId !== undefined) {
    return args.userBookId;
  }

  if (args.bookId === undefined) {
    throw new Error("Provide userBookId or bookId.");
  }

  const userId = await resolveUserId(client, { me: true });
  const response = await client.query<UserBooksResponse>(
    /* GraphQL */ `
      query ResolveUserBookId($userId: Int!, $bookId: Int!) {
        user_books(
          where: {
            user_id: { _eq: $userId }
            book_id: { _eq: $bookId }
          }
          limit: 1
          order_by: { updated_at: desc }
        ) {
          id
        }
      }
    `,
    {
      bookId: args.bookId,
      userId,
    },
  );

  const userBook = response.user_books[0] as { id?: number } | undefined;

  if (!userBook?.id) {
    throw new Error(`No library entry found for book ${args.bookId}.`);
  }

  return userBook.id;
}

async function findExistingUserBookId(
  client: HardcoverClient,
  bookId: number,
): Promise<number | null> {
  const userId = await resolveUserId(client, { me: true });
  const response = await client.query<UserBooksResponse>(
    /* GraphQL */ `
      query FindExistingUserBook($userId: Int!, $bookId: Int!) {
        user_books(
          where: {
            user_id: { _eq: $userId }
            book_id: { _eq: $bookId }
          }
          limit: 1
          order_by: { updated_at: desc }
        ) {
          id
        }
      }
    `,
    {
      bookId,
      userId,
    },
  );

  const userBook = response.user_books[0] as { id?: number } | undefined;
  return userBook?.id ?? null;
}

async function resolvePromptId(
  client: HardcoverClient,
  args: {
    id?: number | undefined;
    slug?: string | undefined;
  },
): Promise<number> {
  const [selector, value] = requireSingleSelector([
    ["id", args.id],
    ["slug", args.slug],
  ]);

  if (selector === "id") {
    return value as number;
  }

  const response = await client.query<PromptsResponse>(
    /* GraphQL */ `
      query PromptIdBySlug($slug: String!) {
        prompts(where: { slug: { _eq: $slug } }, limit: 1) {
          id
        }
      }
    `,
    { slug: value },
  );

  const prompt = response.prompts[0] as { id?: number } | undefined;

  if (!prompt?.id) {
    throw new Error(`No prompt found for slug "${value}".`);
  }

  return prompt.id;
}

async function resolvePromptAnswerId(
  client: HardcoverClient,
  args: {
    promptAnswerId?: number | undefined;
    promptId?: number | undefined;
    bookId?: number | undefined;
  },
): Promise<number> {
  if (args.promptAnswerId !== undefined) {
    return args.promptAnswerId;
  }

  if (args.promptId === undefined || args.bookId === undefined) {
    throw new Error("Provide promptAnswerId or both promptId and bookId.");
  }

  const userId = await resolveUserId(client, { me: true });
  const response = await client.query<PromptAnswersResponse>(
    /* GraphQL */ `
      query ResolvePromptAnswerId($promptId: Int!, $bookId: Int!, $userId: Int!) {
        prompt_answers(
          where: {
            prompt_id: { _eq: $promptId }
            book_id: { _eq: $bookId }
            user_id: { _eq: $userId }
          }
          limit: 1
          order_by: { created_at: desc }
        ) {
          id
        }
      }
    `,
    {
      bookId: args.bookId,
      promptId: args.promptId,
      userId,
    },
  );

  const promptAnswer = response.prompt_answers[0] as { id?: number } | undefined;

  if (!promptAnswer?.id) {
    throw new Error(
      `No prompt answer found for prompt ${args.promptId} and book ${args.bookId}.`,
    );
  }

  return promptAnswer.id;
}

function mapPrivacySettingToId(
  privacy: z.infer<typeof listPrivacySchema> | undefined,
): number | undefined {
  switch (privacy) {
    case undefined:
      return undefined;
    case "public":
      return 1;
    case "followers_only":
      return 2;
    case "private":
      return 3;
  }
}

function buildListInput(args: {
  name?: string | undefined;
  description?: string | undefined;
  privacy?: z.infer<typeof listPrivacySchema> | undefined;
  ranked?: boolean | undefined;
  featuredProfile?: boolean | undefined;
  url?: string | undefined;
  defaultView?: string | undefined;
}) {
  return pickDefined({
    default_view: args.defaultView,
    description: args.description,
    featured_profile: args.featuredProfile,
    name: args.name,
    privacy_setting_id: mapPrivacySettingToId(args.privacy),
    ranked: args.ranked,
    url: args.url,
  });
}

function buildUserBookUpdateInput(args: {
  editionId?: number | undefined;
  status?: z.infer<typeof libraryStatusSchema> | undefined;
  rating?: number | undefined;
  readCount?: number | undefined;
  dateAdded?: string | undefined;
  firstStartedReadingDate?: string | undefined;
  lastReadDate?: string | undefined;
  privacy?: z.infer<typeof listPrivacySchema> | undefined;
  privateNotes?: string | undefined;
  reviewHasSpoilers?: boolean | undefined;
  reviewedAt?: string | undefined;
  reviewSlate?: unknown;
}) {
  return pickDefined({
    date_added: args.dateAdded,
    edition_id: args.editionId,
    first_started_reading_date: args.firstStartedReadingDate,
    last_read_date: args.lastReadDate,
    privacy_setting_id: mapPrivacySettingToId(args.privacy),
    private_notes: args.privateNotes,
    rating: args.rating,
    read_count: args.readCount,
    review_has_spoilers: args.reviewHasSpoilers,
    reviewed_at: args.reviewedAt,
    review_slate: args.reviewSlate,
    status_id: args.status ? mapStatusToId(args.status) : undefined,
  });
}

function buildUserBookCreateInput(
  args: {
    bookId: number;
  } & Parameters<typeof buildUserBookUpdateInput>[0],
) {
  return {
    book_id: args.bookId,
    ...buildUserBookUpdateInput(args),
  };
}

function buildDatesReadInput(args: {
  editionId?: number | undefined;
  startedAt?: string | undefined;
  finishedAt?: string | undefined;
  progressPages?: number | undefined;
  progressSeconds?: number | undefined;
}) {
  return pickDefined({
    edition_id: args.editionId,
    finished_at: args.finishedAt,
    progress_pages: args.progressPages,
    progress_seconds: args.progressSeconds,
    started_at: args.startedAt,
  });
}

function buildPromptInput(args: {
  question: string;
  description: string;
  privacy: z.infer<typeof listPrivacySchema>;
}) {
  return {
    description: args.description,
    privacy_setting_id: mapPrivacySettingToId(args.privacy),
    question: args.question,
  };
}

function parseOptionalJson(
  value: string | undefined,
  fieldName: string,
): unknown | undefined {
  if (value === undefined) {
    return undefined;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error(
      `${fieldName} must be valid JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export function registerHardcoverTools(
  server: McpServer,
  client: HardcoverClient,
): void {
  server.registerTool(
    "hardcover_search",
    {
      title: "Hardcover Search",
      description: "Search Hardcover entities by query text and entity type.",
      inputSchema: {
        query: z.string().min(1).describe("Free-text search query."),
        type: searchTypeSchema
          .default("all")
          .describe("Entity type to search."),
        page: z.number().int().min(1).max(20).default(1),
        limit: z.number().int().min(1).max(10).default(5),
      },
      outputSchema: TOOL_OUTPUT_SCHEMA,
      annotations: toolAnnotations,
    },
    async ({ query, type, page, limit }) => {
      const response = await client.query<SearchResponse>(SEARCH_QUERY, {
        page,
        perPage: limit,
        query,
        queryType: mapSearchQueryType(type),
      });

      return makeTextResult(
        "Hardcover search results",
        summarizeSearchPayload(response.search, type),
      );
    },
  );

  server.registerTool(
    "hardcover_get_book",
    {
      title: "Get Hardcover Book",
      description: "Fetch a Hardcover book by numeric id or slug.",
      inputSchema: {
        id: z.number().int().positive().optional(),
        slug: z.string().min(1).optional(),
      },
      outputSchema: TOOL_OUTPUT_SCHEMA,
      annotations: toolAnnotations,
    },
    async ({ id, slug }) => {
      requireSingleSelector([
        ["id", id],
        ["slug", slug],
      ]);

      const response = await client.query<BooksResponse>(
        /* GraphQL */ `
          query GetBook($where: books_bool_exp!) {
            books(where: $where, limit: 1) {
              ${BOOK_FIELDS}
            }
          }
        `,
        { where: buildBookWhere({ id, slug }) },
      );

      return makeTextResult("Hardcover book", response.books[0] ?? null);
    },
  );

  server.registerTool(
    "hardcover_get_author",
    {
      title: "Get Hardcover Author",
      description: "Fetch a Hardcover author by id, slug, or exact name.",
      inputSchema: {
        id: z.number().int().positive().optional(),
        slug: z.string().min(1).optional(),
        name: z.string().min(1).optional(),
        booksLimit: z.number().int().min(1).max(20).default(10),
      },
      outputSchema: TOOL_OUTPUT_SCHEMA,
      annotations: toolAnnotations,
    },
    async ({ id, slug, name, booksLimit }) => {
      requireSingleSelector([
        ["id", id],
        ["slug", slug],
        ["name", name],
      ]);

      const response = await client.query<AuthorsResponse>(
        /* GraphQL */ `
          query GetAuthor($where: authors_bool_exp!, $booksLimit: Int!) {
            authors(where: $where, limit: 1) {
              ${AUTHOR_FIELDS}
            }
          }
        `,
        {
          booksLimit,
          where: buildAuthorWhere({ id, slug, name }),
        },
      );

      return makeTextResult("Hardcover author", response.authors[0] ?? null);
    },
  );

  server.registerTool(
    "hardcover_get_edition",
    {
      title: "Get Hardcover Edition",
      description: "Fetch a Hardcover edition by id, ISBN-13, or ASIN.",
      inputSchema: {
        id: z.number().int().positive().optional(),
        isbn13: z.string().min(1).optional(),
        asin: z.string().min(1).optional(),
      },
      outputSchema: TOOL_OUTPUT_SCHEMA,
      annotations: toolAnnotations,
    },
    async ({ id, isbn13, asin }) => {
      requireSingleSelector([
        ["id", id],
        ["isbn13", isbn13],
        ["asin", asin],
      ]);

      const response = await client.query<EditionsResponse>(
        /* GraphQL */ `
          query GetEdition($where: editions_bool_exp!) {
            editions(where: $where, limit: 1) {
              ${EDITION_FIELDS}
            }
          }
        `,
        { where: buildEditionWhere({ id, isbn13, asin }) },
      );

      return makeTextResult("Hardcover edition", response.editions[0] ?? null);
    },
  );

  server.registerTool(
    "hardcover_get_user",
    {
      title: "Get Hardcover User",
      description: "Fetch the current Hardcover user or look up a user by id or username.",
      inputSchema: {
        id: z.number().int().positive().optional(),
        username: z.string().min(1).optional(),
        me: z.boolean().optional(),
      },
      outputSchema: TOOL_OUTPUT_SCHEMA,
      annotations: toolAnnotations,
    },
    async ({ id, username, me }) => {
      const [selector, value] = requireSingleSelector([
        ["id", id],
        ["username", username],
        ["me", me],
      ]);

      if (selector === "me") {
        const response = await client.query<MeResponse>(
          /* GraphQL */ `
            query Me {
              me {
                ${USER_FIELDS}
              }
            }
          `,
        );

        return makeTextResult(
          "Hardcover user",
          normalizeMe(response.me as Record<string, unknown> | Array<Record<string, unknown>>),
        );
      }

      const where =
        selector === "id"
          ? { id: { _eq: value } }
          : { username: { _eq: value } };

      const response = await client.query<UsersResponse>(
        /* GraphQL */ `
          query GetUser($where: users_bool_exp!) {
            users(where: $where, limit: 1) {
              ${USER_FIELDS}
            }
          }
        `,
        { where },
      );

      return makeTextResult("Hardcover user", response.users[0] ?? null);
    },
  );

  server.registerTool(
    "hardcover_get_publisher",
    {
      title: "Get Hardcover Publisher",
      description: "Fetch a Hardcover publisher by id, slug, or exact name.",
      inputSchema: {
        id: z.number().int().positive().optional(),
        slug: z.string().min(1).optional(),
        name: z.string().min(1).optional(),
        editionsLimit: z.number().int().min(1).max(20).default(10),
      },
      outputSchema: TOOL_OUTPUT_SCHEMA,
      annotations: toolAnnotations,
    },
    async ({ id, slug, name, editionsLimit }) => {
      requireSingleSelector([
        ["id", id],
        ["slug", slug],
        ["name", name],
      ]);

      const response = await client.query<PublishersResponse>(
        /* GraphQL */ `
          query GetPublisher($where: publishers_bool_exp!, $editionsLimit: Int!) {
            publishers(where: $where, limit: 1) {
              ${PUBLISHER_FIELDS}
            }
          }
        `,
        {
          editionsLimit,
          where: buildPublisherWhere({ id, slug, name }),
        },
      );

      return makeTextResult("Hardcover publisher", response.publishers[0] ?? null);
    },
  );

  server.registerTool(
    "hardcover_get_character",
    {
      title: "Get Hardcover Character",
      description: "Fetch a Hardcover character by id, slug, or exact name.",
      inputSchema: {
        id: z.number().int().positive().optional(),
        slug: z.string().min(1).optional(),
        name: z.string().min(1).optional(),
        booksLimit: z.number().int().min(1).max(20).default(10),
      },
      outputSchema: TOOL_OUTPUT_SCHEMA,
      annotations: toolAnnotations,
    },
    async ({ id, slug, name, booksLimit }) => {
      requireSingleSelector([
        ["id", id],
        ["slug", slug],
        ["name", name],
      ]);

      const response = await client.query<CharactersResponse>(
        /* GraphQL */ `
          query GetCharacter($where: characters_bool_exp!, $booksLimit: Int!) {
            characters(where: $where, limit: 1) {
              ${CHARACTER_FIELDS}
            }
          }
        `,
        {
          booksLimit,
          where: buildCharacterWhere({ id, slug, name }),
        },
      );

      return makeTextResult("Hardcover character", response.characters[0] ?? null);
    },
  );

  server.registerTool(
    "hardcover_get_series",
    {
      title: "Get Hardcover Series",
      description: "Fetch a Hardcover series by id, slug, or exact name.",
      inputSchema: {
        id: z.number().int().positive().optional(),
        slug: z.string().min(1).optional(),
        name: z.string().min(1).optional(),
        booksLimit: z.number().int().min(1).max(25).default(10),
      },
      outputSchema: TOOL_OUTPUT_SCHEMA,
      annotations: toolAnnotations,
    },
    async ({ id, slug, name, booksLimit }) => {
      requireSingleSelector([
        ["id", id],
        ["slug", slug],
        ["name", name],
      ]);

      const response = await client.query<SeriesResponse>(
        /* GraphQL */ `
          query GetSeries($where: series_bool_exp!, $booksLimit: Int!) {
            series(where: $where, limit: 1) {
              ${SERIES_FIELDS}
            }
          }
        `,
        {
          booksLimit,
          where: buildSeriesWhere({ id, slug, name }),
        },
      );

      return makeTextResult("Hardcover series", response.series[0] ?? null);
    },
  );

  server.registerTool(
    "hardcover_get_activity_feed",
    {
      title: "Get Hardcover Activity Feed",
      description:
        "Fetch recent Hardcover activity from your for-you feed, the global stream, or a specific user.",
      inputSchema: {
        feed: activityFeedModeSchema.default("for_you"),
        id: z.number().int().positive().optional(),
        username: z.string().min(1).optional(),
        me: z.boolean().optional(),
        event: z.string().min(1).optional(),
        limit: z.number().int().min(1).max(25).default(10),
        offset: z.number().int().min(0).max(200).default(0),
      },
      outputSchema: TOOL_OUTPUT_SCHEMA,
      annotations: toolAnnotations,
    },
    async ({ feed, id, username, me, event, limit, offset }) => {
      const hasUserSelector =
        id !== undefined || username !== undefined || me !== undefined;
      const effectiveFeed = hasUserSelector ? "user" : feed;

      if (effectiveFeed === "user") {
        const userId = await resolveUserId(
          client,
          hasUserSelector ? { id, username, me } : { me: true },
        );

        const where = pickDefined({
          event: event ? { _eq: event } : undefined,
          user_id: { _eq: userId },
        });

        const response = await client.query<ActivitiesResponse>(
          /* GraphQL */ `
            query GetUserActivityFeed(
              $limit: Int!
              $offset: Int!
              $where: activities_bool_exp!
            ) {
              activities(
                where: $where
                limit: $limit
                offset: $offset
                order_by: { created_at: desc }
              ) {
                ${ACTIVITY_FIELDS}
              }
            }
          `,
          {
            limit,
            offset,
            where,
          },
        );

        return makeTextResult("Hardcover activity feed", {
          activities: response.activities,
          event: event ?? null,
          feed: effectiveFeed,
          limit,
          offset,
          userId,
        });
      }

      if (effectiveFeed === "global") {
        const where = pickDefined({
          event: event ? { _eq: event } : undefined,
        });

        const response = await client.query<ActivitiesResponse>(
          /* GraphQL */ `
            query GetGlobalActivityFeed(
              $limit: Int!
              $offset: Int!
              $where: activities_bool_exp!
            ) {
              activities(
                where: $where
                limit: $limit
                offset: $offset
                order_by: { created_at: desc }
              ) {
                ${ACTIVITY_FIELDS}
              }
            }
          `,
          {
            limit,
            offset,
            where,
          },
        );

        return makeTextResult("Hardcover activity feed", {
          activities: response.activities,
          event: event ?? null,
          feed: effectiveFeed,
          limit,
          offset,
        });
      }

      const where = pickDefined({
        event: event ? { _eq: event } : undefined,
      });

      const response = await client.query<ActivityForYouFeedResponse>(
        /* GraphQL */ `
          query GetForYouActivityFeed(
            $feedArgs: activity_foryou_feed_args!
            $limit: Int!
            $offset: Int!
            $where: activities_bool_exp!
          ) {
            activity_foryou_feed(
              args: $feedArgs
              where: $where
              limit: $limit
              offset: $offset
              order_by: { created_at: desc }
            ) {
              ${ACTIVITY_FIELDS}
            }
          }
        `,
        {
          feedArgs: {
            feed_limit: limit,
            feed_offset: offset,
          },
          limit,
          offset,
          where,
        },
      );

      return makeTextResult("Hardcover activity feed", {
        activities: response.activity_foryou_feed,
        event: event ?? null,
        feed: effectiveFeed,
        limit,
        offset,
      });
    },
  );

  server.registerTool(
    "hardcover_get_user_library",
    {
      title: "Get Hardcover User Library",
      description:
        "Fetch a user's library entries, optionally filtered by reading status.",
      inputSchema: {
        id: z.number().int().positive().optional(),
        username: z.string().min(1).optional(),
        me: z.boolean().optional(),
        status: libraryStatusFilterSchema.optional(),
        limit: z.number().int().min(1).max(25).default(10),
        offset: z.number().int().min(0).max(200).default(0),
      },
      outputSchema: TOOL_OUTPUT_SCHEMA,
      annotations: toolAnnotations,
    },
    async ({ id, username, me, status, limit, offset }) => {
      const userId = await resolveUserId(client, { id, username, me });
      const statuses = Array.isArray(status) ? status : status ? [status] : [];

      const statusFilter = statuses.length
        ? { status_id: { _in: statuses.map(mapStatusToId) } }
        : {};

      const response = await client.query<UserBooksResponse>(
        /* GraphQL */ `
          query GetUserLibrary(
            $limit: Int!
            $offset: Int!
            $where: user_books_bool_exp!
          ) {
            user_books(
              where: $where
              distinct_on: book_id
              limit: $limit
              offset: $offset
              order_by: [{ book_id: asc }, { updated_at: desc }]
            ) {
              id
              status_id
              rating
              created_at
              updated_at
              book {
                id
                slug
                title
                cached_contributors
                rating
                release_year
              }
              edition {
                id
                title
                isbn_13
                physical_format
              }
            }
          }
        `,
        {
          limit,
          offset,
          where: {
            user_id: { _eq: userId },
            ...statusFilter,
          },
        },
      );

      return makeTextResult("Hardcover user library", {
        limit,
        offset,
        status: statuses,
        userId,
        userBooks: response.user_books,
      });
    },
  );

  server.registerTool(
    "hardcover_get_list",
    {
      title: "Get Hardcover List",
      description: "Fetch a Hardcover list by id or slug, including list books.",
      inputSchema: {
        id: z.number().int().positive().optional(),
        slug: z.string().min(1).optional(),
        booksLimit: z.number().int().min(1).max(50).default(20),
      },
      outputSchema: TOOL_OUTPUT_SCHEMA,
      annotations: toolAnnotations,
    },
    async ({ id, slug, booksLimit }) => {
      requireSingleSelector([
        ["id", id],
        ["slug", slug],
      ]);

      const response = await client.query<ListsResponse>(
        /* GraphQL */ `
          query GetList($where: lists_bool_exp!, $booksLimit: Int!) {
            lists(where: $where, limit: 1) {
              ${LIST_FIELDS}
              list_books(limit: $booksLimit, order_by: { position: asc }) {
                position
                book {
                  id
                  slug
                  title
                  cached_contributors
                  rating
                  release_year
                }
                edition {
                  id
                  title
                  isbn_13
                  physical_format
                }
              }
            }
          }
        `,
        {
          booksLimit,
          where: buildListWhere({ id, slug }),
        },
      );

      return makeTextResult("Hardcover list", response.lists[0] ?? null);
    },
  );

  server.registerTool(
    "hardcover_get_prompt",
    {
      title: "Get Hardcover Prompt",
      description: "Fetch a Hardcover prompt by id or slug.",
      inputSchema: {
        id: z.number().int().positive().optional(),
        slug: z.string().min(1).optional(),
      },
      outputSchema: TOOL_OUTPUT_SCHEMA,
      annotations: toolAnnotations,
    },
    async ({ id, slug }) => {
      requireSingleSelector([
        ["id", id],
        ["slug", slug],
      ]);

      const where =
        id !== undefined ? { id: { _eq: id } } : { slug: { _eq: slug } };

      const response = await client.query<PromptsResponse>(
        /* GraphQL */ `
          query GetPrompt($where: prompts_bool_exp!) {
            prompts(where: $where, limit: 1) {
              ${PROMPT_FIELDS}
              prompt_answers(limit: 10, order_by: { created_at: desc }) {
                ${PROMPT_ANSWER_FIELDS}
              }
            }
          }
        `,
        { where },
      );

      return makeTextResult("Hardcover prompt", response.prompts[0] ?? null);
    },
  );

  server.registerTool(
    "hardcover_create_prompt",
    {
      title: "Create Hardcover Prompt",
      description: "Create a new Hardcover prompt.",
      inputSchema: {
        question: z.string().min(1),
        description: z.string().min(1),
        privacy: listPrivacySchema.default("public"),
      },
      outputSchema: TOOL_OUTPUT_SCHEMA,
      annotations: writeAnnotations,
    },
    async ({ question, description, privacy }) => {
      const response = await client.query<{ insert_prompt: unknown }>(
        /* GraphQL */ `
          mutation CreatePrompt($object: CreatePromptInput!) {
            insert_prompt(object: $object) {
              error
              id
              prompt {
                ${PROMPT_FIELDS}
              }
            }
          }
        `,
        {
          object: buildPromptInput({ description, privacy, question }),
        },
      );

      return makeTextResult("Hardcover prompt created", response.insert_prompt);
    },
  );

  server.registerTool(
    "hardcover_update_prompt",
    {
      title: "Update Hardcover Prompt",
      description: "Update an existing Hardcover prompt owned by the authenticated user.",
      inputSchema: {
        id: z.number().int().positive().optional(),
        slug: z.string().min(1).optional(),
        question: z.string().min(1),
        description: z.string().min(1),
        privacy: listPrivacySchema.default("public"),
      },
      outputSchema: TOOL_OUTPUT_SCHEMA,
      annotations: idempotentWriteAnnotations,
    },
    async ({ id, slug, question, description, privacy }) => {
      requireSingleSelector([
        ["id", id],
        ["slug", slug],
      ]);

      const promptId = await resolvePromptId(client, { id, slug });
      const response = await client.query<{ update_prompt: unknown }>(
        /* GraphQL */ `
          mutation UpdatePrompt($object: UpdatePromptInput!) {
            update_prompt(object: $object) {
              error
              id
              prompt {
                ${PROMPT_FIELDS}
              }
            }
          }
        `,
        {
          object: {
            ...buildPromptInput({ description, privacy, question }),
            id: promptId,
          },
        },
      );

      return makeTextResult("Hardcover prompt updated", response.update_prompt);
    },
  );

  server.registerTool(
    "hardcover_delete_prompt",
    {
      title: "Delete Hardcover Prompt",
      description: "Delete a Hardcover prompt owned by the authenticated user.",
      inputSchema: {
        id: z.number().int().positive().optional(),
        slug: z.string().min(1).optional(),
      },
      outputSchema: TOOL_OUTPUT_SCHEMA,
      annotations: destructiveAnnotations,
    },
    async ({ id, slug }) => {
      requireSingleSelector([
        ["id", id],
        ["slug", slug],
      ]);

      const promptId = await resolvePromptId(client, { id, slug });
      const response = await client.query<{ delete_prompts_by_pk: unknown }>(
        /* GraphQL */ `
          mutation DeletePrompt($id: Int!) {
            delete_prompts_by_pk(id: $id) {
              ${PROMPT_FIELDS}
            }
          }
        `,
        { id: promptId },
      );

      return makeTextResult("Hardcover prompt deleted", response.delete_prompts_by_pk);
    },
  );

  server.registerTool(
    "hardcover_follow_prompt",
    {
      title: "Follow Hardcover Prompt",
      description: "Follow a Hardcover prompt.",
      inputSchema: {
        id: z.number().int().positive().optional(),
        slug: z.string().min(1).optional(),
      },
      outputSchema: TOOL_OUTPUT_SCHEMA,
      annotations: idempotentWriteAnnotations,
    },
    async ({ id, slug }) => {
      requireSingleSelector([
        ["id", id],
        ["slug", slug],
      ]);

      const promptId = await resolvePromptId(client, { id, slug });
      const response = await client.query<{ upsert_followed_prompt: unknown }>(
        /* GraphQL */ `
          mutation FollowPrompt($promptId: Int!) {
            upsert_followed_prompt(prompt_id: $promptId) {
              id
              errors
              followed_prompt {
                id
                prompt_id
              }
            }
          }
        `,
        { promptId },
      );

      return makeTextResult("Hardcover prompt followed", response.upsert_followed_prompt);
    },
  );

  server.registerTool(
    "hardcover_unfollow_prompt",
    {
      title: "Unfollow Hardcover Prompt",
      description: "Unfollow a Hardcover prompt.",
      inputSchema: {
        id: z.number().int().positive().optional(),
        slug: z.string().min(1).optional(),
      },
      outputSchema: TOOL_OUTPUT_SCHEMA,
      annotations: destructiveAnnotations,
    },
    async ({ id, slug }) => {
      requireSingleSelector([
        ["id", id],
        ["slug", slug],
      ]);

      const promptId = await resolvePromptId(client, { id, slug });
      const response = await client.query<{ delete_followed_prompt: unknown }>(
        /* GraphQL */ `
          mutation UnfollowPrompt($promptId: Int!) {
            delete_followed_prompt(prompt_id: $promptId) {
              success
            }
          }
        `,
        { promptId },
      );

      return makeTextResult("Hardcover prompt unfollowed", {
        promptId,
        result: response.delete_followed_prompt,
      });
    },
  );

  server.registerTool(
    "hardcover_add_prompt_answer",
    {
      title: "Add Hardcover Prompt Answer",
      description: "Answer a Hardcover prompt with a book from your library.",
      inputSchema: {
        promptId: z.number().int().positive().optional(),
        promptSlug: z.string().min(1).optional(),
        bookId: z.number().int().positive(),
        description: z.string().optional(),
      },
      outputSchema: TOOL_OUTPUT_SCHEMA,
      annotations: writeAnnotations,
    },
    async ({ promptId, promptSlug, bookId, description }) => {
      requireSingleSelector([
        ["promptId", promptId],
        ["promptSlug", promptSlug],
      ]);

      const resolvedPromptId = await resolvePromptId(client, {
        id: promptId,
        slug: promptSlug,
      });

      const response = await client.query<{ insert_prompt_answer: unknown }>(
        /* GraphQL */ `
          mutation AddPromptAnswer($object: PromptAnswerCreateInput!) {
            insert_prompt_answer(object: $object) {
              id
              prompt_id
              book_id
              prompt_answer {
                ${PROMPT_ANSWER_FIELDS}
              }
            }
          }
        `,
        {
          object: pickDefined({
            book_id: bookId,
            description,
            prompt_id: resolvedPromptId,
          }),
        },
      );

      return makeTextResult(
        "Hardcover prompt answer created",
        response.insert_prompt_answer,
      );
    },
  );

  server.registerTool(
    "hardcover_update_prompt_answer",
    {
      title: "Update Hardcover Prompt Answer",
      description: "Update the description of an existing prompt answer.",
      inputSchema: {
        promptAnswerId: z.number().int().positive().optional(),
        promptId: z.number().int().positive().optional(),
        bookId: z.number().int().positive().optional(),
        description: z.string().min(1),
      },
      outputSchema: TOOL_OUTPUT_SCHEMA,
      annotations: idempotentWriteAnnotations,
    },
    async ({ promptAnswerId, promptId, bookId, description }) => {
      requireAtLeastOneDefined(
        [
          ["promptAnswerId", promptAnswerId],
          ["promptId", promptId],
        ],
        "Provide promptAnswerId or promptId/bookId.",
      );

      const resolvedPromptAnswerId = await resolvePromptAnswerId(client, {
        bookId,
        promptAnswerId,
        promptId,
      });

      const response = await client.query<{ update_prompt_answers_by_pk: unknown }>(
        /* GraphQL */ `
          mutation UpdatePromptAnswer($id: Int!, $set: prompt_answers_set_input!) {
            update_prompt_answers_by_pk(pk_columns: { id: $id }, _set: $set) {
              ${PROMPT_ANSWER_FIELDS}
            }
          }
        `,
        {
          id: resolvedPromptAnswerId,
          set: { description },
        },
      );

      return makeTextResult(
        "Hardcover prompt answer updated",
        response.update_prompt_answers_by_pk,
      );
    },
  );

  server.registerTool(
    "hardcover_delete_prompt_answer",
    {
      title: "Delete Hardcover Prompt Answer",
      description: "Delete a prompt answer by id, or by prompt/book pair.",
      inputSchema: {
        promptAnswerId: z.number().int().positive().optional(),
        promptId: z.number().int().positive().optional(),
        bookId: z.number().int().positive().optional(),
      },
      outputSchema: TOOL_OUTPUT_SCHEMA,
      annotations: destructiveAnnotations,
    },
    async ({ promptAnswerId, promptId, bookId }) => {
      requireAtLeastOneDefined(
        [
          ["promptAnswerId", promptAnswerId],
          ["promptId", promptId],
        ],
        "Provide promptAnswerId or promptId/bookId.",
      );

      const resolvedPromptAnswerId = await resolvePromptAnswerId(client, {
        bookId,
        promptAnswerId,
        promptId,
      });

      const response = await client.query<{ delete_prompt_answer: unknown }>(
        /* GraphQL */ `
          mutation DeletePromptAnswer($id: Int!) {
            delete_prompt_answer(id: $id) {
              id
              prompt_id
              book_id
              prompt_answer {
                ${PROMPT_ANSWER_FIELDS}
              }
            }
          }
        `,
        { id: resolvedPromptAnswerId },
      );

      return makeTextResult(
        "Hardcover prompt answer deleted",
        response.delete_prompt_answer,
      );
    },
  );

  server.registerTool(
    "hardcover_create_list",
    {
      title: "Create Hardcover List",
      description: "Create a new Hardcover list for the authenticated user.",
      inputSchema: {
        name: z.string().min(1),
        description: z.string().optional(),
        privacy: listPrivacySchema.default("public"),
        ranked: z.boolean().optional(),
        featuredProfile: z.boolean().optional(),
        url: z.string().url().optional(),
        defaultView: z.string().min(1).optional(),
      },
      outputSchema: TOOL_OUTPUT_SCHEMA,
      annotations: writeAnnotations,
    },
    async ({ name, description, privacy, ranked, featuredProfile, url, defaultView }) => {
      const response = await client.query<{ insert_list: unknown }>(
        /* GraphQL */ `
          mutation CreateList($object: ListInput!) {
            insert_list(object: $object) {
              id
              errors
              list {
                ${LIST_FIELDS}
              }
            }
          }
        `,
        {
          object: buildListInput({
            defaultView,
            description,
            featuredProfile,
            name,
            privacy,
            ranked,
            url,
          }),
        },
      );

      return makeTextResult("Hardcover list created", response.insert_list);
    },
  );

  server.registerTool(
    "hardcover_update_list",
    {
      title: "Update Hardcover List",
      description: "Update an existing Hardcover list owned by the authenticated user.",
      inputSchema: {
        id: z.number().int().positive().optional(),
        slug: z.string().min(1).optional(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        privacy: listPrivacySchema.optional(),
        ranked: z.boolean().optional(),
        featuredProfile: z.boolean().optional(),
        url: z.string().url().optional(),
        defaultView: z.string().min(1).optional(),
      },
      outputSchema: TOOL_OUTPUT_SCHEMA,
      annotations: idempotentWriteAnnotations,
    },
    async ({ id, slug, name, description, privacy, ranked, featuredProfile, url, defaultView }) => {
      requireSingleSelector([
        ["id", id],
        ["slug", slug],
      ]);

      const object = buildListInput({
        defaultView,
        description,
        featuredProfile,
        name,
        privacy,
        ranked,
        url,
      });

      if (Object.keys(object).length === 0) {
        throw new Error("At least one list field must be provided to update.");
      }

      const listId = await resolveListId(client, { id, slug });
      const response = await client.query<{ update_list: unknown }>(
        /* GraphQL */ `
          mutation UpdateList($id: Int!, $object: ListInput!) {
            update_list(id: $id, object: $object) {
              id
              errors
              list {
                ${LIST_FIELDS}
              }
            }
          }
        `,
        {
          id: listId,
          object,
        },
      );

      return makeTextResult("Hardcover list updated", response.update_list);
    },
  );

  server.registerTool(
    "hardcover_delete_list",
    {
      title: "Delete Hardcover List",
      description: "Delete a Hardcover list owned by the authenticated user.",
      inputSchema: {
        id: z.number().int().positive().optional(),
        slug: z.string().min(1).optional(),
      },
      outputSchema: TOOL_OUTPUT_SCHEMA,
      annotations: destructiveAnnotations,
    },
    async ({ id, slug }) => {
      requireSingleSelector([
        ["id", id],
        ["slug", slug],
      ]);

      const listId = await resolveListId(client, { id, slug });
      const response = await client.query<{ delete_list: unknown }>(
        /* GraphQL */ `
          mutation DeleteList($id: Int!) {
            delete_list(id: $id) {
              success
            }
          }
        `,
        { id: listId },
      );

      return makeTextResult("Hardcover list deleted", {
        id: listId,
        result: response.delete_list,
      });
    },
  );

  server.registerTool(
    "hardcover_add_book_to_list",
    {
      title: "Add Book To Hardcover List",
      description: "Add a book to a Hardcover list owned by the authenticated user.",
      inputSchema: {
        listId: z.number().int().positive().optional(),
        listSlug: z.string().min(1).optional(),
        bookId: z.number().int().positive(),
        editionId: z.number().int().positive().optional(),
        position: z.number().int().positive().optional(),
      },
      outputSchema: TOOL_OUTPUT_SCHEMA,
      annotations: writeAnnotations,
    },
    async ({ listId, listSlug, bookId, editionId, position }) => {
      requireSingleSelector([
        ["listId", listId],
        ["listSlug", listSlug],
      ]);

      const resolvedListId = await resolveListId(client, {
        id: listId,
        slug: listSlug,
      });

      const response = await client.query<{ insert_list_book: unknown }>(
        /* GraphQL */ `
          mutation AddBookToList($object: ListBookInput!) {
            insert_list_book(object: $object) {
              id
              list_book {
                ${LIST_BOOK_FIELDS}
              }
            }
          }
        `,
        {
          object: pickDefined({
            book_id: bookId,
            edition_id: editionId,
            list_id: resolvedListId,
            position,
          }),
        },
      );

      return makeTextResult("Hardcover list book created", response.insert_list_book);
    },
  );

  server.registerTool(
    "hardcover_update_list_book",
    {
      title: "Update Hardcover List Book",
      description: "Update a list entry's position or reason.",
      inputSchema: {
        listBookId: z.number().int().positive().optional(),
        listId: z.number().int().positive().optional(),
        bookId: z.number().int().positive().optional(),
        position: z.number().int().positive().optional(),
        reason: z.string().optional(),
      },
      outputSchema: TOOL_OUTPUT_SCHEMA,
      annotations: idempotentWriteAnnotations,
    },
    async ({ listBookId, listId, bookId, position, reason }) => {
      const update = pickDefined({
        position,
        reason,
      });

      if (Object.keys(update).length === 0) {
        throw new Error("At least one of position or reason must be provided.");
      }

      const resolvedListBookId = await resolveListBookId(client, {
        listBookId,
        listId,
        bookId,
      });

      const response = await client.query<{ update_list_books_by_pk: unknown }>(
        /* GraphQL */ `
          mutation UpdateListBook($id: Int!, $set: list_books_set_input!) {
            update_list_books_by_pk(pk_columns: { id: $id }, _set: $set) {
              ${LIST_BOOK_FIELDS}
            }
          }
        `,
        {
          id: resolvedListBookId,
          set: update,
        },
      );

      return makeTextResult(
        "Hardcover list book updated",
        response.update_list_books_by_pk,
      );
    },
  );

  server.registerTool(
    "hardcover_remove_book_from_list",
    {
      title: "Remove Book From Hardcover List",
      description: "Remove a book from a Hardcover list owned by the authenticated user.",
      inputSchema: {
        listBookId: z.number().int().positive().optional(),
        listId: z.number().int().positive().optional(),
        bookId: z.number().int().positive().optional(),
      },
      outputSchema: TOOL_OUTPUT_SCHEMA,
      annotations: destructiveAnnotations,
    },
    async ({ listBookId, listId, bookId }) => {
      const resolvedListBookId = await resolveListBookId(client, {
        listBookId,
        listId,
        bookId,
      });

      const response = await client.query<{ delete_list_book: unknown }>(
        /* GraphQL */ `
          mutation RemoveBookFromList($id: Int!) {
            delete_list_book(id: $id) {
              id
              list_id
              list {
                ${LIST_FIELDS}
              }
            }
          }
        `,
        { id: resolvedListBookId },
      );

      return makeTextResult(
        "Hardcover list book deleted",
        response.delete_list_book,
      );
    },
  );

  server.registerTool(
    "hardcover_follow_list",
    {
      title: "Follow Hardcover List",
      description: "Follow a public Hardcover list.",
      inputSchema: {
        id: z.number().int().positive().optional(),
        slug: z.string().min(1).optional(),
      },
      outputSchema: TOOL_OUTPUT_SCHEMA,
      annotations: idempotentWriteAnnotations,
    },
    async ({ id, slug }) => {
      requireSingleSelector([
        ["id", id],
        ["slug", slug],
      ]);

      const listId = await resolveListId(client, { id, slug });
      const response = await client.query<{ upsert_followed_list: unknown }>(
        /* GraphQL */ `
          mutation FollowList($listId: Int!) {
            upsert_followed_list(list_id: $listId) {
              id
              errors
              followed_list {
                id
                list_id
              }
            }
          }
        `,
        { listId },
      );

      return makeTextResult("Hardcover list followed", response.upsert_followed_list);
    },
  );

  server.registerTool(
    "hardcover_unfollow_list",
    {
      title: "Unfollow Hardcover List",
      description: "Unfollow a Hardcover list.",
      inputSchema: {
        id: z.number().int().positive().optional(),
        slug: z.string().min(1).optional(),
      },
      outputSchema: TOOL_OUTPUT_SCHEMA,
      annotations: destructiveAnnotations,
    },
    async ({ id, slug }) => {
      requireSingleSelector([
        ["id", id],
        ["slug", slug],
      ]);

      const listId = await resolveListId(client, { id, slug });
      const response = await client.query<{ delete_followed_list: unknown }>(
        /* GraphQL */ `
          mutation UnfollowList($listId: Int!) {
            delete_followed_list(list_id: $listId) {
              success
            }
          }
        `,
        { listId },
      );

      return makeTextResult("Hardcover list unfollowed", {
        listId,
        result: response.delete_followed_list,
      });
    },
  );

  server.registerTool(
    "hardcover_set_user_book",
    {
      title: "Set Hardcover User Book",
      description:
        "Create or update the authenticated user's library entry for a book.",
      inputSchema: {
        bookId: z.number().int().positive(),
        editionId: z.number().int().positive().optional(),
        status: libraryStatusSchema.optional(),
        rating: z.number().min(0).max(5).optional(),
        readCount: z.number().int().min(0).max(1000).optional(),
        dateAdded: isoDateSchema.optional(),
        firstStartedReadingDate: isoDateSchema.optional(),
        lastReadDate: isoDateSchema.optional(),
        privacy: listPrivacySchema.optional(),
        privateNotes: z.string().optional(),
        reviewHasSpoilers: z.boolean().optional(),
        reviewedAt: isoDateSchema.optional(),
        reviewSlateJson: z.string().optional(),
      },
      outputSchema: TOOL_OUTPUT_SCHEMA,
      annotations: idempotentWriteAnnotations,
    },
    async ({
      bookId,
      editionId,
      status,
      rating,
      readCount,
      dateAdded,
      firstStartedReadingDate,
      lastReadDate,
      privacy,
      privateNotes,
      reviewHasSpoilers,
      reviewedAt,
      reviewSlateJson,
    }) => {
      const reviewSlate = parseOptionalJson(reviewSlateJson, "reviewSlateJson");

      requireAtLeastOneDefined(
        [
          ["editionId", editionId],
          ["status", status],
          ["rating", rating],
          ["readCount", readCount],
          ["dateAdded", dateAdded],
          ["firstStartedReadingDate", firstStartedReadingDate],
          ["lastReadDate", lastReadDate],
          ["privacy", privacy],
          ["privateNotes", privateNotes],
          ["reviewHasSpoilers", reviewHasSpoilers],
          ["reviewedAt", reviewedAt],
          ["reviewSlateJson", reviewSlateJson],
        ],
        "At least one user book field must be provided.",
      );

      const updateObject = buildUserBookUpdateInput({
        dateAdded,
        editionId,
        firstStartedReadingDate,
        lastReadDate,
        privacy,
        privateNotes,
        rating,
        readCount,
        reviewHasSpoilers,
        reviewedAt,
        reviewSlate,
        status,
      });

      const existingUserBookId = await findExistingUserBookId(client, bookId);

      if (existingUserBookId) {
        const response = await client.query<{ update_user_book: unknown }>(
          /* GraphQL */ `
            mutation UpdateUserBook($id: Int!, $object: UserBookUpdateInput!) {
              update_user_book(id: $id, object: $object) {
                error
                id
                user_book {
                  ${USER_BOOK_FIELDS}
                }
              }
            }
          `,
          {
            id: existingUserBookId,
            object: updateObject,
          },
        );

        return makeTextResult("Hardcover user book updated", response.update_user_book);
      }

      const response = await client.query<{ insert_user_book: unknown }>(
        /* GraphQL */ `
          mutation InsertUserBook($object: UserBookCreateInput!) {
            insert_user_book(object: $object) {
              error
              id
              user_book {
                ${USER_BOOK_FIELDS}
              }
            }
          }
        `,
        {
          object: buildUserBookCreateInput({
            bookId,
            dateAdded,
            editionId,
            firstStartedReadingDate,
            lastReadDate,
            privacy,
            privateNotes,
            rating,
            readCount,
            reviewHasSpoilers,
            reviewedAt,
            reviewSlate,
            status,
          }),
        },
      );

      return makeTextResult("Hardcover user book created", response.insert_user_book);
    },
  );

  server.registerTool(
    "hardcover_delete_user_book",
    {
      title: "Delete Hardcover User Book",
      description:
        "Delete the authenticated user's library entry for a book.",
      inputSchema: {
        userBookId: z.number().int().positive().optional(),
        bookId: z.number().int().positive().optional(),
      },
      outputSchema: TOOL_OUTPUT_SCHEMA,
      annotations: destructiveAnnotations,
    },
    async ({ userBookId, bookId }) => {
      requireAtLeastOneDefined(
        [
          ["userBookId", userBookId],
          ["bookId", bookId],
        ],
        "Provide userBookId or bookId.",
      );

      const resolvedUserBookId = await resolveUserBookId(client, {
        bookId,
        userBookId,
      });

      const response = await client.query<{ delete_user_book: unknown }>(
        /* GraphQL */ `
          mutation DeleteUserBook($id: Int!) {
            delete_user_book(id: $id) {
              id
              book_id
              user_id
              user_book {
                ${USER_BOOK_FIELDS}
              }
            }
          }
        `,
        { id: resolvedUserBookId },
      );

      return makeTextResult("Hardcover user book deleted", response.delete_user_book);
    },
  );

  server.registerTool(
    "hardcover_add_user_book_read",
    {
      title: "Add Hardcover User Book Read",
      description:
        "Add a read-date entry to the authenticated user's library record.",
      inputSchema: {
        userBookId: z.number().int().positive().optional(),
        bookId: z.number().int().positive().optional(),
        editionId: z.number().int().positive().optional(),
        startedAt: isoDateSchema.optional(),
        finishedAt: isoDateSchema.optional(),
        progressPages: z.number().int().min(0).optional(),
        progressSeconds: z.number().int().min(0).optional(),
      },
      outputSchema: TOOL_OUTPUT_SCHEMA,
      annotations: writeAnnotations,
    },
    async ({
      userBookId,
      bookId,
      editionId,
      startedAt,
      finishedAt,
      progressPages,
      progressSeconds,
    }) => {
      requireAtLeastOneDefined(
        [
          ["userBookId", userBookId],
          ["bookId", bookId],
        ],
        "Provide userBookId or bookId.",
      );
      requireAtLeastOneDefined(
        [
          ["editionId", editionId],
          ["startedAt", startedAt],
          ["finishedAt", finishedAt],
          ["progressPages", progressPages],
          ["progressSeconds", progressSeconds],
        ],
        "At least one read-date field must be provided.",
      );

      const resolvedUserBookId = await resolveUserBookId(client, {
        bookId,
        userBookId,
      });

      const response = await client.query<{ insert_user_book_read: unknown }>(
        /* GraphQL */ `
          mutation InsertUserBookRead($userBookId: Int!, $userBookRead: DatesReadInput!) {
            insert_user_book_read(user_book_id: $userBookId, user_book_read: $userBookRead) {
              error
              id
              user_book_read {
                ${USER_BOOK_READ_FIELDS}
              }
            }
          }
        `,
        {
          userBookId: resolvedUserBookId,
          userBookRead: buildDatesReadInput({
            editionId,
            finishedAt,
            progressPages,
            progressSeconds,
            startedAt,
          }),
        },
      );

      return makeTextResult(
        "Hardcover user book read created",
        response.insert_user_book_read,
      );
    },
  );

  server.registerTool(
    "hardcover_update_user_book_read",
    {
      title: "Update Hardcover User Book Read",
      description: "Update an existing user_book_read entry.",
      inputSchema: {
        userBookReadId: z.number().int().positive(),
        editionId: z.number().int().positive().optional(),
        startedAt: isoDateSchema.optional(),
        finishedAt: isoDateSchema.optional(),
        progressPages: z.number().int().min(0).optional(),
        progressSeconds: z.number().int().min(0).optional(),
      },
      outputSchema: TOOL_OUTPUT_SCHEMA,
      annotations: idempotentWriteAnnotations,
    },
    async ({ userBookReadId, editionId, startedAt, finishedAt, progressPages, progressSeconds }) => {
      requireAtLeastOneDefined(
        [
          ["editionId", editionId],
          ["startedAt", startedAt],
          ["finishedAt", finishedAt],
          ["progressPages", progressPages],
          ["progressSeconds", progressSeconds],
        ],
        "At least one read-date field must be provided.",
      );

      const response = await client.query<{ update_user_book_read: unknown }>(
        /* GraphQL */ `
          mutation UpdateUserBookRead($id: Int!, $object: DatesReadInput!) {
            update_user_book_read(id: $id, object: $object) {
              error
              id
              user_book_read {
                ${USER_BOOK_READ_FIELDS}
              }
            }
          }
        `,
        {
          id: userBookReadId,
          object: buildDatesReadInput({
            editionId,
            finishedAt,
            progressPages,
            progressSeconds,
            startedAt,
          }),
        },
      );

      return makeTextResult(
        "Hardcover user book read updated",
        response.update_user_book_read,
      );
    },
  );

  server.registerTool(
    "hardcover_delete_user_book_read",
    {
      title: "Delete Hardcover User Book Read",
      description: "Delete a user_book_read entry by id.",
      inputSchema: {
        userBookReadId: z.number().int().positive(),
      },
      outputSchema: TOOL_OUTPUT_SCHEMA,
      annotations: destructiveAnnotations,
    },
    async ({ userBookReadId }) => {
      const response = await client.query<{ delete_user_book_read: unknown }>(
        /* GraphQL */ `
          mutation DeleteUserBookRead($id: Int!) {
            delete_user_book_read(id: $id) {
              error
              id
              user_book_read {
                ${USER_BOOK_READ_FIELDS}
              }
            }
          }
        `,
        { id: userBookReadId },
      );

      return makeTextResult(
        "Hardcover user book read deleted",
        response.delete_user_book_read,
      );
    },
  );
}

function mapStatusToId(status: z.infer<typeof libraryStatusSchema>): number {
  switch (status) {
    case "want_to_read":
      return 1;
    case "currently_reading":
      return 2;
    case "read":
      return 3;
    case "paused":
      return 4;
    case "did_not_finish":
      return 5;
    case "ignored":
      return 6;
  }
}

import { createPool } from "@vercel/postgres";
import { drizzle } from "drizzle-orm/vercel-postgres";

import * as schema from "./schema";

// Workaround for @vercel/postgres with Supabase pooler
// Vercel checks for "-pooler." in the URL, so we add a query param to trick it
// See: https://github.com/orgs/supabase/discussions/14165
const connectionString =
  process.env.POSTGRES_URL + "?workaround=supabase-pooler.vercel";

const client = createPool({ connectionString });

export const db = drizzle({
  client,
  schema,
  casing: "snake_case",
});

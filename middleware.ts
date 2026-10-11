import { NextRequest, NextResponse } from 'next/server';
import data from '@/lib/data.json';
import { Category } from '@/lib/generated/prisma/enums';

// Product and category pages can't use dynamicParams = false (see the product page), so an unknown
// path would render on demand: a cached 404 per made-up URL, plus a database query for products.
// Turned away here instead. The deploy seeds every product in lib/data.json and never deletes one,
// so that file is the catalog; categories are the schema's enum.
const known: Record<string, Set<string>> = {
  product: new Set(data.map((product) => product.slug)),
  category: new Set(Object.values(Category)),
};

export const NOT_FOUND_PATH = '/category/not-found';

export const middleware = (request: NextRequest) => {
  const [, section, name] = request.nextUrl.pathname.split('/');
  if (known[section]?.has(name)) return NextResponse.next();
  // One fixed path the category route answers with a 404 (no database read, one cache entry).
  // Not '/404': Vercel serves that page with status 200 when it's reached through a rewrite.
  return NextResponse.rewrite(new URL(NOT_FOUND_PATH, request.url));
};

export const config = { matcher: ['/product/:slug', '/category/:name'] };

// @vitest-environment node
import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { middleware } from './middleware';

const visit = (path: string) => middleware(new NextRequest(`http://localhost${path}`));

describe('middleware', () => {
  it.each(['/product/zx9-speaker', '/category/speakers'])('lets %s through', (path) => {
    expect(visit(path).headers.get('x-middleware-rewrite')).toBeNull();
  });

  it.each(['/product/nope', '/category/nope', '/category/zx9-speaker'])(
    'sends %s to the 404 page before the route renders',
    (path) => {
      expect(visit(path).headers.get('x-middleware-rewrite')).toBe('http://localhost/404');
    }
  );
});

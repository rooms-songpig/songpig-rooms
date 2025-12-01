import { cache } from 'react';
import { promises as fs } from 'fs';
import path from 'path';

const CHANGELOG_PATH = path.join(process.cwd(), 'CHANGELOG.md');

export const getChangelogContent = cache(async (): Promise<string> => {
  const file = await fs.readFile(CHANGELOG_PATH, 'utf-8');
  return file;
});

export const getCurrentVersionInfo = cache(async (): Promise<{ version: string; date?: string }> => {
  const changelog = await getChangelogContent();
  const match = changelog.match(/^## \[(.+?)\] - ([^\n]+)/m);
  if (match) {
    return { version: match[1], date: match[2] };
  }
  return { version: '0.0.0', date: undefined };
});



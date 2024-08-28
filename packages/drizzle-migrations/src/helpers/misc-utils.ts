import path from 'node:path';

export function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

export function getFileNameWithoutExtension(filePath: string): string {
  return path.basename(filePath, path.extname(filePath));
}

export function getFileExtension(filePath: string): string {
  return path.extname(filePath);
}

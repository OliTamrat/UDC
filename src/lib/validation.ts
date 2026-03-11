const DANGEROUS_PATTERNS = [
  /<script[\s>]/i,
  /javascript:/i,
  /on\w+\s*=/i,
  /data:\s*text\/html/i,
];

export function sanitizeSearchInput(input: string): string {
  let cleaned = input.trim().slice(0, 200);
  cleaned = cleaned
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
  return cleaned;
}

export function isInputSafe(input: string): boolean {
  return !DANGEROUS_PATTERNS.some((pattern) => pattern.test(input));
}

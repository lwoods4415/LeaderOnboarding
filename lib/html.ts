/**
 * Renders authored content that contains inline HTML (<em>, <b>, <i>).
 * Only ever pass text from /content, never anything a leader typed.
 */
export const raw = (html: string) => ({ dangerouslySetInnerHTML: { __html: html } });

type SearchParamValue = string | string[] | undefined;
export type SearchParams = Promise<Record<string, SearchParamValue>>;

/** A positive integer id from a search param, or null. */
export function idParam(value: SearchParamValue): number | null {
  const n = Number(typeof value === "string" ? value : undefined);
  return Number.isInteger(n) && n > 0 ? n : null;
}

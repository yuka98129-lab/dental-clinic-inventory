export const CATEGORIES = [
  "治療系",
  "滅菌・消毒系",
  "予防系",
  "診療消耗品",
  "器具・器材",
  "技工・補綴系",
  "清掃・洗浄系",
  "事務・その他",
] as const;

export type Category = (typeof CATEGORIES)[number];

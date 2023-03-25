import { unparse, parse } from "papaparse";

export const convertToCsvDataUri = <T extends unknown[]>(data: T): string => {
  const rowsString = unparse(data, { header: true });
  return "data:text/csv;charset=utf-8," + encodeURIComponent(rowsString);
};

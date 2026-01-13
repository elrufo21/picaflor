import type { ReactNode } from "react";

export type ListColumn<T> = {
  key?: keyof T;
  id?: string;
  header: string;
  render?: (row: T) => ReactNode;
};

export type ModuleListConfig<T> = {
  basePath: string;
  columns: ListColumn<T>[];
  idKey?: keyof T;
  createLabel?: string;
  deleteMessage?: string;
  filterKeys?: (keyof T | string)[];
  renderFilters?: ReactNode;
};

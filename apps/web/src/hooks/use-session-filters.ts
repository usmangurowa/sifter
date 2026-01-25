"use client";

import { parseAsArrayOf, parseAsString, useQueryStates } from "nuqs";

export const useSessionFilters = () => {
  const [filters, setFilters] = useQueryStates({
    project: parseAsArrayOf(parseAsString).withDefault([]),
    branch: parseAsArrayOf(parseAsString).withDefault([]),
    action: parseAsArrayOf(parseAsString).withDefault([]),
  });

  return {
    filters,
    setFilters,
  };
};

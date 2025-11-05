import { useState, useCallback } from 'react';

export function usePagination(initialPage = 1, initialSize = 12) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialSize);
  const [total, setTotal] = useState(0);

  const handlePageChange = useCallback((page: number, size?: number) => {
    setCurrentPage(page);
    if (size && size !== pageSize) {
      setPageSize(size);
    }
  }, [pageSize]);

  const resetPagination = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return {
    currentPage,
    pageSize,
    total,
    setTotal,
    handlePageChange,
    resetPagination,
  };
}

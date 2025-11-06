import { useState, useCallback } from 'react';
import { message } from 'antd';

interface ApiResponse<T> {
  code: number;
  data: T;
  message?: string;
}

export function useDataFetch<T>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async (
    fetchFn: () => Promise<ApiResponse<T>>,
    errorMsg: string = '数据加载失败'
  ) => {
    setLoading(true);
    try {
      const result = await fetchFn();
      if (result.code === 0) {
        setData(result.data);
        return result.data;
      } else {
        message.error(result.message || errorMsg);
        return null;
      }
    } catch (error) {
      message.error(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, setData, loading, fetchData };
}



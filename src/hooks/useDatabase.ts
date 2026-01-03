import { useState, useEffect, useCallback } from 'react';
import { DatabaseService } from '@/services/database.service';

export function useDatabase<T>(service: DatabaseService<T>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const result = await service.getAll();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const create = useCallback(async (item: Partial<T>) => {
    try {
      const newItem = await service.create(item);
      setData(prev => [...prev, newItem]);
      return newItem;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [service]);

  const update = useCallback(async (id: string, item: Partial<T>) => {
    try {
      const updatedItem = await service.update(id, item);
      setData(prev => prev.map(d => (d as any).id === id ? updatedItem : d));
      return updatedItem;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [service]);

  const remove = useCallback(async (id: string) => {
    try {
      await service.delete(id);
      setData(prev => prev.filter(d => (d as any).id !== id));
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [service]);

  const query = useCallback(async (filters: Record<string, any>) => {
    try {
      setLoading(true);
      const result = await service.query(filters);
      setData(result);
      setError(null);
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [service]);

  return {
    data,
    loading,
    error,
    fetchAll,
    create,
    update,
    remove,
    query,
  };
}

export function useDatabaseItem<T>(service: DatabaseService<T>, id: string | undefined) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchItem = async () => {
      try {
        setLoading(true);
        const result = await service.getById(id);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [service, id]);

  return { data, loading, error };
}

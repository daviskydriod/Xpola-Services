// FILE PATH: src/hooks/useShop.ts

import { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';
import { apiFetch, ApiProduct, ApiCategory, Pagination } from '@/lib/api';

export type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'popular' | 'featured';

export interface UseShopReturn {
  products:            ApiProduct[];
  categories:          ApiCategory[];
  loading:             boolean;
  error:               string | null;
  pagination:          Pagination | null;
  page:                number;
  setPage:             Dispatch<SetStateAction<number>>;
  search:              string;
  setSearch:           (s: string) => void;
  selectedCategory:    string;
  setSelectedCategory: (s: string) => void;
  sortBy:              SortOption;
  setSortBy:           (s: SortOption) => void;
  showInStock:         boolean;
  setShowInStock:      (v: boolean) => void;
  reload:              () => void;
  hasFilters:          boolean;
  clearFilters:        () => void;
}

export const useShop = (country: 'NG' | 'CA'): UseShopReturn => {
  const [products,          setProducts]          = useState<ApiProduct[]>([]);
  const [categories,        setCategories]        = useState<ApiCategory[]>([]);
  const [loading,           setLoading]           = useState(true);
  const [error,             setError]             = useState<string | null>(null);
  const [pagination,        setPagination]        = useState<Pagination | null>(null);
  const [page,              setPage]              = useState(1);
  const [search,            setSearch]            = useState('');
  const [selectedCategory,  setSelectedCategory]  = useState('');
  const [sortBy,            setSortBy]            = useState<SortOption>('newest');
  const [showInStock,       setShowInStock]       = useState(false);
  const [tick,              setTick]              = useState(0);

  const reload = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    apiFetch<{ data: ApiCategory[] }>(`/categories.php?country=${country}`)
      .then(d => setCategories(d.data))
      .catch(() => {});
  }, [country]);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ country, page: String(page), per_page: '20', sort: sortBy });
    if (selectedCategory) params.set('category', selectedCategory);
    if (search.trim())    params.set('search', search.trim());
    if (showInStock)     params.set('in_stock', '1');

    apiFetch<{ data: ApiProduct[]; pagination: Pagination }>(`/products.php?${params}`)
      .then(d => {
        let items = d.data;
        setProducts(items);
        setPagination(d.pagination);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [country, page, search, selectedCategory, sortBy, showInStock, tick]);

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSortBy('newest');
    setShowInStock(false);
    setPage(1);
  };

  const hasFilters = !!(search || selectedCategory || showInStock || sortBy !== 'newest');

  return {
    products, categories, loading, error, pagination,
    page, setPage,
    search, setSearch,
    selectedCategory, setSelectedCategory,
    sortBy, setSortBy,
    showInStock, setShowInStock,
    reload, hasFilters, clearFilters,
  };
};
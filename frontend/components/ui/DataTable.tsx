'use client';

import { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
  onSearch?: (query: string) => void;
  onSort?: (key: string, dir: 'asc' | 'desc') => void;
  isLoading?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  keyExtractor: (item: T) => string;
}

export default function DataTable<T>({
  columns, data, total, page, totalPages,
  onPageChange = () => {}, onSearch, onSort, isLoading,
  searchPlaceholder = 'Search...',
  emptyMessage = 'No data found',
  keyExtractor,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState('');

  const handleSort = (key: string) => {
    const dir = sortKey === key && sortDir === 'asc' ? 'desc' : 'asc';
    setSortKey(key);
    setSortDir(dir);
    onSort?.(key, dir);
  };

  const handleSearch = (val: string) => {
    setSearch(val);
    onSearch?.(val);
  };

  const SortIcon = ({ col }: { col: Column<T> }) => {
    if (!col.sortable) return null;
    if (sortKey !== col.key) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
    return sortDir === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  return (
    <div>
      {onSearch && (
        <div className="relative mb-4">
          <Search className="absolute left-xs top-1/2 -translate-y-1/2 w-sm h-sm text-foreground/40" />
          <input
            className="input pl-9"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      )}

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={col.sortable ? 'cursor-pointer select-none hover:text-foreground' : ''}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <span className="inline-flex items-center">
                    {col.label}
                    <SortIcon col={col} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12 text-foreground/40">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={keyExtractor(item)}>
                  {columns.map((col) => (
                    <td key={col.key} className={col.className}>
                      {col.render
                        ? col.render(item)
                        : String((item as Record<string, unknown>)[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-sm text-small">
          <span className="text-foreground/50 text-small">
            Page {page} of {totalPages} ({total} total)
          </span>
          <div className="flex gap-3xs">
            <button className="pagination-btn" onClick={() => onPageChange(1)} disabled={page === 1}>
              <ChevronsLeft className="w-sm h-sm" />
            </button>
            <button className="pagination-btn" onClick={() => onPageChange(page - 1)} disabled={page === 1}>
              <ChevronLeft className="w-sm h-sm" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const p = start + i;
              if (p > totalPages) return null;
              return (
                <button
                  key={p}
                  className={`pagination-btn ${p === page ? 'active' : ''}`}
                  onClick={() => onPageChange(p)}
                >
                  {p}
                </button>
              );
            })}
            <button className="pagination-btn" onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>
              <ChevronRight className="w-sm h-sm" />
            </button>
            <button className="pagination-btn" onClick={() => onPageChange(totalPages)} disabled={page === totalPages}>
              <ChevronsRight className="w-sm h-sm" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

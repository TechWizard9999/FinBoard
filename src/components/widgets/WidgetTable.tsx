'use client';

import { useState, useMemo } from 'react';
import { Search, ChevronUp, ChevronDown } from 'lucide-react';
import { Widget } from '@/types';
import { getValueAtPath, formatValue } from '@/utils/apiUtils';
import { useDashboardStore } from '@/store/dashboardStore';

interface WidgetTableProps {
  widget: Widget;
}

export default function WidgetTable({ widget }: WidgetTableProps) {
  const { theme } = useDashboardStore();
  const isLight = theme === 'light';
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Extract array data from widget data
  const tableData = useMemo(() => {
    if (!widget.data) return [];

    // Try to find array data in the selected fields
    for (const field of widget.selectedFields) {
      const value = getValueAtPath(widget.data, field.path);
      if (Array.isArray(value)) {
        return value;
      }
    }

    // If no array field selected, try to find any array in the data
    const findArray = (obj: unknown, depth = 0): unknown[] | null => {
      if (depth > 3) return null;
      if (Array.isArray(obj) && obj.length > 0 && typeof obj[0] === 'object') {
        return obj;
      }
      if (typeof obj === 'object' && obj !== null) {
        for (const value of Object.values(obj)) {
          const result = findArray(value, depth + 1);
          if (result) return result;
        }
      }
      return null;
    };

    return findArray(widget.data) || [];
  }, [widget.data, widget.selectedFields]);

  // Get column headers from the first item
  const columns = useMemo(() => {
    if (tableData.length === 0) return [];
    const firstItem = tableData[0];
    if (typeof firstItem !== 'object' || firstItem === null) return [];
    return Object.keys(firstItem as object);
  }, [tableData]);

  // Filter and sort data
  const processedData = useMemo(() => {
    let result = [...tableData];

    // Apply search filter
    if (searchQuery) {
      result = result.filter((item) => {
        const values = Object.values(item as object);
        return values.some((value) =>
          String(value).toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
    }

    // Apply sorting
    if (sortField) {
      result.sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[sortField];
        const bVal = (b as Record<string, unknown>)[sortField];
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        const aStr = String(aVal || '');
        const bStr = String(bVal || '');
        return sortDirection === 'asc'
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
      });
    }

    return result;
  }, [tableData, searchQuery, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const paginatedData = processedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  if (tableData.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-slate-500">
        No table data available. Please select an array field.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Search Bar */}
      <div className={`border-b p-3 ${isLight ? 'border-slate-200' : 'border-slate-700/50'}`}>
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-slate-400'}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search table..."
            className={`w-full rounded-lg border py-2 pl-10 pr-4 text-sm outline-none transition-colors focus:border-emerald-500 ${
              isLight 
                ? 'border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400' 
                : 'border-slate-600 bg-slate-700/50 text-white placeholder-slate-400'
            }`}
          />
        </div>
        <div className={`mt-2 text-right text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
          {processedData.length} of {tableData.length} items
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className={`sticky top-0 ${isLight ? 'bg-slate-50' : 'bg-slate-800'}`}>
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  className={`cursor-pointer whitespace-nowrap px-4 py-3 text-left font-medium ${
                    isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {col}
                    {sortField === col && (
                      sortDirection === 'asc' ? (
                        <ChevronUp className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-emerald-500" />
                      )
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((item, index) => (
              <tr
                key={index}
                className={`border-t ${
                  isLight 
                    ? 'border-slate-100 hover:bg-slate-50' 
                    : 'border-slate-700/30 hover:bg-slate-700/30'
                }`}
              >
                {columns.map((col) => (
                  <td
                    key={col}
                    className={`whitespace-nowrap px-4 py-3 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}
                  >
                    {formatValue((item as Record<string, unknown>)[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={`flex items-center justify-center gap-2 border-t p-3 ${
          isLight ? 'border-slate-200' : 'border-slate-700/50'
        }`}>
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`rounded px-3 py-1 text-sm transition-colors disabled:opacity-50 ${
              isLight 
                ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-700' 
                : 'text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            Previous
          </button>
          <span className={`text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={`rounded px-3 py-1 text-sm transition-colors disabled:opacity-50 ${
              isLight 
                ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-700' 
                : 'text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}


import React, { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';

export default function DataTable({
  columns, data, loading, emptyTitle = 'No data', emptyDescription,
  page, totalPages, onPageChange,
  sortKey, sortOrder, onSort,
}) {
  const handleSort = (key) => {
    if (!onSort) return;
    if (sortKey === key) {
      onSort(key, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onSort(key, 'desc');
    }
  };

  return (
    <div className="card p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-vx-secondary/60 border-b border-vx-border">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`table-header ${col.sortable && onSort ? 'cursor-pointer hover:text-vx-text select-none' : ''}`}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && onSort && (
                      <span className="flex flex-col ml-1">
                        <ChevronUp className={`w-2.5 h-2.5 ${sortKey === col.key && sortOrder === 'asc' ? 'text-vx-blue' : 'text-vx-border'}`} />
                        <ChevronDown className={`w-2.5 h-2.5 -mt-0.5 ${sortKey === col.key && sortOrder === 'desc' ? 'text-vx-blue' : 'text-vx-border'}`} />
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center">
                  <LoadingSpinner message="Loading data..." />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr key={row._id || row.id || idx} className="table-row">
                  {columns.map((col) => (
                    <td key={col.key} className="table-cell">
                      {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-vx-border">
          <p className="text-vx-muted text-xs">Page {page} of {totalPages}</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg bg-vx-secondary disabled:opacity-40 hover:bg-vx-border transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-vx-muted" />
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg bg-vx-secondary disabled:opacity-40 hover:bg-vx-border transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-vx-muted" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

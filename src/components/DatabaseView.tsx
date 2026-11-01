import React, { useState } from 'react';
import { 
  Table as TableIcon, Kanban, Plus, MoreHorizontal, Check, Trash2, Calendar, 
  Tag, Search, X, CheckSquare, Type, GripVertical, Sparkles, Filter, ArrowUpDown
} from 'lucide-react';
import { Database, DatabaseColumn, DatabaseRow, DatabaseViewType, ColumnType } from '../types';
import { nanoid } from 'nanoid';
import { t, Language } from '../i18n';

interface DatabaseViewProps {
  database: Database;
  language?: Language;
  onUpdateDatabase: (updated: Database) => void;
}

export const DatabaseView: React.FC<DatabaseViewProps> = ({ database, language = 'en', onUpdateDatabase }) => {
  const [activeView, setActiveView] = useState<DatabaseViewType>(database.view || 'table');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'none' | 'title-asc' | 'title-desc' | 'date-newest' | 'date-oldest'>('none');
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColType, setNewColType] = useState<ColumnType>('text');

  // Drag & drop state for Kanban cards
  const [draggedRowId, setDraggedRowId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);

  const handleViewChange = (view: DatabaseViewType) => {
    setActiveView(view);
    onUpdateDatabase({ ...database, view });
  };

  const handleAddRow = (statusVal?: string) => {
    const newRowId = 'row-' + nanoid(6);
    const newRow: DatabaseRow = {
      id: newRowId,
      cells: {
        'c-title': t('untitledItem', language),
        'c-status': statusVal || 'not-started',
      },
    };
    onUpdateDatabase({
      ...database,
      rows: [...database.rows, newRow],
    });
  };

  const handleDeleteRow = (rowId: string) => {
    onUpdateDatabase({
      ...database,
      rows: database.rows.filter((r) => r.id !== rowId),
    });
  };

  const handleCellChange = (rowId: string, colId: string, value: any) => {
    const updatedRows = database.rows.map((row) => {
      if (row.id === rowId) {
        return {
          ...row,
          cells: {
            ...row.cells,
            [colId]: value,
          },
        };
      }
      return row;
    });
    onUpdateDatabase({ ...database, rows: updatedRows });
  };

  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;

    const newColId = 'c-' + nanoid(6);
    const newColumn: DatabaseColumn = {
      id: newColId,
      name: newColName.trim(),
      type: newColType,
      options:
        newColType === 'status'
          ? [
              { id: 'not-started', label: 'Not Started', color: '#e0e0e0' },
              { id: 'in-progress', label: 'In Progress', color: '#cce2ff' },
              { id: 'done', label: 'Done', color: '#c3f0c8' },
            ]
          : undefined,
    };

    onUpdateDatabase({
      ...database,
      columns: [...database.columns, newColumn],
    });

    setNewColName('');
    setShowAddColumn(false);
  };

  const handleDeleteColumn = (colId: string) => {
    if (colId === 'c-title') return; // Do not delete primary title column
    onUpdateDatabase({
      ...database,
      columns: database.columns.filter((c) => c.id !== colId),
    });
  };

  // Status column options
  const statusCol = database.columns.find((c) => c.type === 'status');
  const defaultStatusOptions = [
    { id: 'not-started', label: t('notStarted', language), color: '#e0e0e0' },
    { id: 'in-progress', label: t('inProgress', language), color: '#cce2ff' },
    { id: 'done', label: t('done', language), color: '#c3f0c8' },
  ];
  const statusOptions = statusCol?.options || defaultStatusOptions;

  // Filter & sort rows
  const filteredAndSortedRows = database.rows
    .filter((row) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = Object.values(row.cells).some((val) =>
          typeof val === 'string' ? val.toLowerCase().includes(query) : false
        );
        if (!matchesSearch) return false;
      }
      if (statusFilter !== 'all') {
        const rowStatus = row.cells['c-status'] || 'not-started';
        if (rowStatus !== statusFilter) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'title-asc') {
        return (a.cells['c-title'] || '').localeCompare(b.cells['c-title'] || '');
      }
      if (sortBy === 'title-desc') {
        return (b.cells['c-title'] || '').localeCompare(a.cells['c-title'] || '');
      }
      if (sortBy === 'date-newest') {
        return (b.cells['c-date'] || '').localeCompare(a.cells['c-date'] || '');
      }
      if (sortBy === 'date-oldest') {
        return (a.cells['c-date'] || '').localeCompare(b.cells['c-date'] || '');
      }
      return 0;
    });

  // Summary statistics
  const totalRowsCount = database.rows.length;
  const checkboxCol = database.columns.find((c) => c.type === 'checkbox');
  const completedCheckboxes = checkboxCol
    ? database.rows.filter((r) => r.cells[checkboxCol.id] === true).length
    : 0;
  const doneStatusCount = database.rows.filter((r) => r.cells['c-status'] === 'done').length;

  return (
    <div className="my-6 border border-[#e9e9e7] dark:border-[#2e2e2e] rounded-xl overflow-hidden bg-white dark:bg-[#202020] shadow-sm">
      {/* Top Database Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 border-b border-[#e9e9e7] dark:border-[#2e2e2e] bg-[#fbfbfa] dark:bg-[#252525] gap-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            dir="auto"
            value={database.title}
            onChange={(e) => onUpdateDatabase({ ...database, title: e.target.value })}
            className="font-semibold text-sm bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1.5 py-0.5 text-[#37352f] dark:text-[#ebebeb]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Status Filter Pills */}
          <div className="flex items-center gap-1 text-[11px]">
            <Filter className="w-3 h-3 text-gray-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-gray-700 rounded-md px-2 py-0.5 text-[11px] text-[#37352f] dark:text-[#ebebeb] focus:outline-none cursor-pointer"
            >
              <option value="all">{t('all', language)}</option>
              {statusOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1 text-[11px]">
            <ArrowUpDown className="w-3 h-3 text-gray-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-gray-700 rounded-md px-2 py-0.5 text-[11px] text-[#37352f] dark:text-[#ebebeb] focus:outline-none cursor-pointer"
            >
              <option value="none">{t('sort', language)}</option>
              <option value="title-asc">A → Z</option>
              <option value="title-desc">Z → A</option>
              <option value="date-newest">Date (Newest)</option>
              <option value="date-oldest">Date (Oldest)</option>
            </select>
          </div>

          {/* Quick Search */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2 rtl:left-auto rtl:right-2 pointer-events-none" />
            <input
              type="text"
              dir="auto"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchTable', language)}
              className="pl-7 rtl:pl-2 rtl:pr-7 pr-2 py-1 text-xs bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 rounded-md w-28 sm:w-36 focus:w-44 transition-all focus:outline-none text-[#37352f] dark:text-[#ebebeb]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-1.5 rtl:right-auto rtl:left-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* View Switcher Tabs: Table | Board | Gallery */}
          <div className="flex items-center gap-1 bg-[#efefee] dark:bg-[#1a1a1a] p-1 rounded-lg">
            <button
              onClick={() => handleViewChange('table')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                activeView === 'table'
                  ? 'bg-white dark:bg-[#2e2e2e] text-[#37352f] dark:text-[#ebebeb] shadow-xs'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('tableView', language)}</span>
            </button>
            <button
              onClick={() => handleViewChange('board')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                activeView === 'board'
                  ? 'bg-white dark:bg-[#2e2e2e] text-[#37352f] dark:text-[#ebebeb] shadow-xs'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('boardView', language)}</span>
            </button>
            <button
              onClick={() => handleViewChange('gallery')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                activeView === 'gallery'
                  ? 'bg-white dark:bg-[#2e2e2e] text-[#37352f] dark:text-[#ebebeb] shadow-xs'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('galleryView', language)}</span>
            </button>
          </div>
        </div>
      </div>

      {/* View Content */}
      {activeView === 'table' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#e9e9e7] dark:border-[#2e2e2e] bg-[#fbfbfa] dark:bg-[#222222] text-gray-500 dark:text-gray-400">
                <th className="w-10 px-3 py-2 text-center font-normal">#</th>
                {database.columns.map((col) => (
                  <th key={col.id} className="px-3 py-2 font-medium border-r border-[#e9e9e7] dark:border-[#2e2e2e] group/colhead relative">
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 truncate">
                        {col.type === 'status' && <Tag className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                        {col.type === 'checkbox' && <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />}
                        {col.type === 'date' && <Calendar className="w-3.5 h-3.5 text-orange-500 shrink-0" />}
                        {col.type === 'title' && <Type className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
                        {col.type === 'text' && <Type className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
                        <span>{col.name}</span>
                      </div>
                      {col.id !== 'c-title' && (
                        <button
                          onClick={() => handleDeleteColumn(col.id)}
                          className="opacity-0 group-hover/colhead:opacity-100 p-0.5 hover:text-red-500 text-gray-400 rounded cursor-pointer"
                          title="Delete column"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
                
                {/* Add column header button */}
                <th className="w-24 px-2 py-2 border-r border-[#e9e9e7] dark:border-[#2e2e2e]">
                  <button
                    onClick={() => setShowAddColumn(true)}
                    className="flex items-center gap-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t('addColumn', language)}</span>
                  </button>
                </th>
                <th className="w-10 px-2 py-2 text-center"></th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedRows.map((row, idx) => (
                <tr
                  key={row.id}
                  className="border-b border-[#e9e9e7] dark:border-[#2e2e2e] hover:bg-[#fafafa] dark:hover:bg-[#252525] group transition-colors"
                >
                  <td className="px-3 py-2 text-center text-gray-400 font-mono text-[11px]">{idx + 1}</td>
                  {database.columns.map((col) => {
                    const val = row.cells[col.id];

                    if (col.type === 'status') {
                      return (
                        <td key={col.id} className="px-3 py-2 border-r border-[#e9e9e7] dark:border-[#2e2e2e]">
                          <select
                            value={val || ''}
                            onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
                            className="bg-[#f0f0ef] dark:bg-[#2e2e2e] text-[11px] font-medium px-2 py-0.5 rounded cursor-pointer border-none focus:ring-1 focus:ring-blue-500 text-[#37352f] dark:text-[#ebebeb]"
                          >
                            {(col.options || statusOptions).map((opt) => (
                              <option key={opt.id} value={opt.id}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </td>
                      );
                    }

                    if (col.type === 'checkbox') {
                      return (
                        <td key={col.id} className="px-3 py-2 border-r border-[#e9e9e7] dark:border-[#2e2e2e]">
                          <input
                            type="checkbox"
                            checked={!!val}
                            onChange={(e) => handleCellChange(row.id, col.id, e.target.checked)}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
                          />
                        </td>
                      );
                    }

                    if (col.type === 'date') {
                      return (
                        <td key={col.id} className="px-3 py-2 border-r border-[#e9e9e7] dark:border-[#2e2e2e]">
                          <input
                            type="date"
                            value={val || ''}
                            onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
                            className="bg-transparent text-xs text-gray-600 dark:text-gray-300 focus:outline-none"
                          />
                        </td>
                      );
                    }

                    return (
                      <td key={col.id} className="px-3 py-2 border-r border-[#e9e9e7] dark:border-[#2e2e2e]">
                        <input
                          type="text"
                          dir="auto"
                          value={val || ''}
                          onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
                          className="w-full bg-transparent border-none focus:outline-none text-xs text-[#37352f] dark:text-[#ebebeb] placeholder-gray-400"
                          placeholder="Empty"
                        />
                      </td>
                    );
                  })}
                  <td className="border-r border-[#e9e9e7] dark:border-[#2e2e2e]"></td>
                  <td className="px-2 py-2 text-center">
                    <button
                      onClick={() => handleDeleteRow(row.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity p-1 rounded cursor-pointer"
                      title="Delete row"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[#e9e9e7] dark:border-[#2e2e2e] bg-[#fbfbfa]/70 dark:bg-[#1f1f1f] text-gray-500 dark:text-gray-400 font-mono text-[11px]">
                <td className="w-10 px-3 py-1.5 text-center font-bold text-gray-400">∑</td>
                {database.columns.map((col) => (
                  <td key={col.id} className="px-3 py-1.5 border-r border-[#e9e9e7] dark:border-[#2e2e2e]">
                    {col.id === 'c-title' && (
                      <span className="font-semibold text-gray-700 dark:text-gray-300">
                        {totalRowsCount} {t('itemsCount', language)}
                      </span>
                    )}
                    {col.type === 'checkbox' && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        {completedCheckboxes}/{totalRowsCount} ({Math.round((completedCheckboxes / (totalRowsCount || 1)) * 100)}%)
                      </span>
                    )}
                    {col.type === 'status' && (
                      <span className="text-blue-600 dark:text-blue-400 font-medium">
                        {doneStatusCount} {t('done', language)}
                      </span>
                    )}
                  </td>
                ))}
                <td className="w-24 px-2 py-1.5 border-r border-[#e9e9e7] dark:border-[#2e2e2e]"></td>
                <td className="w-10 px-2 py-1.5"></td>
              </tr>
            </tfoot>
          </table>

          {/* Add Row Button */}
          <button
            onClick={() => handleAddRow()}
            className="w-full flex items-center gap-1.5 px-4 py-2 text-xs text-gray-500 dark:text-gray-400 hover:bg-[#efefee] dark:hover:bg-[#282828] transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('newRow', language)}</span>
          </button>
        </div>
      ) : activeView === 'gallery' ? (
        /* Gallery View */
        <div className="p-4 bg-[#fbfbfa] dark:bg-[#1a1a1a]">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {filteredAndSortedRows.map((row, idx) => {
              const gradients = [
                'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                'linear-gradient(135deg, #2b5876 0%, #4e4376 100%)',
                'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)',
                'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
                'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              ];
              const cardGrad = gradients[idx % gradients.length];
              const currentStatus = statusOptions.find(
                (s) => s.id === (row.cells['c-status'] || 'not-started')
              );

              return (
                <div
                  key={row.id}
                  className="rounded-xl border border-[#e9e9e7] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] shadow-xs hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-500 transition-all overflow-hidden flex flex-col justify-between group/card"
                >
                  {/* Card Cover Strip */}
                  <div style={{ background: cardGrad }} className="h-14 w-full relative">
                    <button
                      onClick={() => handleDeleteRow(row.id)}
                      className="absolute top-2 right-2 rtl:right-auto rtl:left-2 opacity-0 group-hover/card:opacity-100 p-1 rounded-md bg-black/60 text-white hover:bg-black/80 transition-opacity cursor-pointer"
                      title="Delete card"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                    <div className="flex items-start gap-1.5">
                      <input
                        type="text"
                        dir="auto"
                        value={row.cells['c-title'] || ''}
                        onChange={(e) => handleCellChange(row.id, 'c-title', e.target.value)}
                        placeholder={t('untitledCard', language)}
                        className="w-full font-bold text-xs bg-transparent border-none outline-none text-[#37352f] dark:text-[#ebebeb]"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                      {/* Status Tag */}
                      <span
                        className="px-2 py-0.5 rounded-full font-medium text-[10px]"
                        style={{
                          backgroundColor: `${currentStatus?.color || '#cbd5e1'}40`,
                          color: currentStatus?.color || '#cbd5e1',
                        }}
                      >
                        {currentStatus?.label || t('notStarted', language)}
                      </span>

                      {/* Date */}
                      {row.cells['c-date'] && (
                        <span className="text-gray-400 flex items-center gap-1 text-[10px]">
                          <Calendar className="w-3 h-3 text-orange-400" />
                          <span>{row.cells['c-date']}</span>
                        </span>
                      )}

                      {/* Checkbox */}
                      {checkboxCol && (
                        <button
                          onClick={() => handleCellChange(row.id, checkboxCol.id, !row.cells[checkboxCol.id])}
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] cursor-pointer ${
                            row.cells[checkboxCol.id] ? 'text-emerald-500 bg-emerald-500/10' : 'text-gray-400 hover:text-gray-600'
                          }`}
                        >
                          <Check className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Quick Add Card */}
            <button
              onClick={() => handleAddRow()}
              className="rounded-xl border border-dashed border-gray-300 dark:border-[#383838] hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 p-6 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-indigo-500 transition-colors cursor-pointer min-h-[120px]"
            >
              <Plus className="w-5 h-5" />
              <span className="text-xs font-medium">{t('newRow', language)}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Board / Kanban View with Drag & Drop */
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-x-auto min-h-[320px] bg-[#fbfbfa] dark:bg-[#1c1c1c]">
          {statusOptions.map((status) => {
            const columnRows = filteredAndSortedRows.filter(
              (r) => (r.cells['c-status'] || 'not-started') === status.id
            );
            const isDragOver = dragOverColumnId === status.id;

            return (
              <div
                key={status.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragOverColumnId !== status.id) {
                    setDragOverColumnId(status.id);
                  }
                }}
                onDragLeave={() => {
                  setDragOverColumnId(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const rowId = e.dataTransfer.getData('text/plain') || draggedRowId;
                  if (rowId) {
                    handleCellChange(rowId, 'c-status', status.id);
                  }
                  setDraggedRowId(null);
                  setDragOverColumnId(null);
                }}
                className={`flex flex-col rounded-xl border p-2.5 min-w-[220px] transition-all duration-150 ${
                  isDragOver
                    ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-400 dark:border-blue-500 ring-2 ring-blue-400/40'
                    : 'bg-white dark:bg-[#242424] border-[#e9e9e7] dark:border-[#2e2e2e] shadow-xs'
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: status.color || '#cbd5e1' }}
                    />
                    <span className="font-semibold text-xs text-[#37352f] dark:text-[#ebebeb]">
                      {status.label}
                    </span>
                    <span className="text-[11px] text-gray-400 font-mono">({columnRows.length})</span>
                  </div>
                  <button
                    onClick={() => handleAddRow(status.id)}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-[#323232] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                    title={t('newRow', language)}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Cards List (Draggable) */}
                <div className="flex-1 space-y-2 overflow-y-auto max-h-[380px] min-h-[100px]">
                  {columnRows.map((row) => {
                    const isDraggingThis = draggedRowId === row.id;

                    return (
                      <div
                        key={row.id}
                        draggable={true}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', row.id);
                          setDraggedRowId(row.id);
                        }}
                        onDragEnd={() => {
                          setDraggedRowId(null);
                          setDragOverColumnId(null);
                        }}
                        className={`p-2.5 rounded-lg border transition-all cursor-grab active:cursor-grabbing group ${
                          isDraggingThis
                            ? 'opacity-40 border-dashed border-blue-400 bg-blue-50/30'
                            : 'bg-[#fafafa] dark:bg-[#2a2a2a] border-[#e9e9e7] dark:border-[#333333] hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1 mb-1.5">
                          <div className="flex items-center gap-1 flex-1">
                            <GripVertical className="w-3 h-3 text-gray-300 dark:text-gray-600 shrink-0 group-hover:text-gray-500" />
                            <input
                              type="text"
                              dir="auto"
                              value={row.cells['c-title'] || ''}
                              onChange={(e) => handleCellChange(row.id, 'c-title', e.target.value)}
                              placeholder={t('untitledCard', language)}
                              className="w-full bg-transparent font-medium text-xs text-[#37352f] dark:text-[#ebebeb] focus:outline-none"
                            />
                          </div>
                          <button
                            onClick={() => handleDeleteRow(row.id)}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity p-0.5 rounded cursor-pointer"
                            title="Delete card"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-[#383838] text-[11px]">
                          {row.cells['c-date'] ? (
                            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1 text-[10px]">
                              <Calendar className="w-3 h-3 text-orange-400" /> {row.cells['c-date']}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-[10px]">No date</span>
                          )}

                          {/* Move card to status fallback dropdown */}
                          <select
                            value={row.cells['c-status'] || 'not-started'}
                            onChange={(e) => handleCellChange(row.id, 'c-status', e.target.value)}
                            className="text-[10px] bg-white dark:bg-[#333333] border border-gray-200 dark:border-gray-600 rounded px-1.5 py-0.5 text-gray-600 dark:text-gray-300"
                          >
                            {statusOptions.map((opt) => (
                              <option key={opt.id} value={opt.id}>
                                → {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}

                  {columnRows.length === 0 && (
                    <div className="text-center py-8 text-[11px] text-gray-400 border border-dashed border-gray-200 dark:border-[#333333] rounded-lg">
                      Drop cards here
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleAddRow(status.id)}
                  className="mt-2 w-full py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:bg-[#efefee] dark:hover:bg-[#323232] rounded-lg flex items-center justify-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add card
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Column Modal / Popover */}
      {showAddColumn && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-80 bg-white dark:bg-[#252525] border border-gray-200 dark:border-[#383838] rounded-xl shadow-2xl p-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-[#333333] mb-3">
              <h4 className="font-semibold text-xs text-[#37352f] dark:text-[#ebebeb]">New Database Column</h4>
              <button
                onClick={() => setShowAddColumn(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddColumn} className="space-y-3">
              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">Column Name</label>
                <input
                  type="text"
                  autoFocus
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  placeholder="e.g. Assignee, Priority, Tags"
                  className="w-full bg-white dark:bg-[#1c1c1c] border border-gray-300 dark:border-[#444] rounded-lg px-2.5 py-1.5 text-xs text-[#37352f] dark:text-[#ebebeb] focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">Column Type</label>
                <select
                  value={newColType}
                  onChange={(e) => setNewColType(e.target.value as ColumnType)}
                  className="w-full bg-white dark:bg-[#1c1c1c] border border-gray-300 dark:border-[#444] rounded-lg px-2.5 py-1.5 text-xs text-[#37352f] dark:text-[#ebebeb] focus:outline-none"
                >
                  <option value="text">Text</option>
                  <option value="status">Status (Tags)</option>
                  <option value="date">Date</option>
                  <option value="checkbox">Checkbox</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700"
                >
                  Add Column
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddColumn(false)}
                  className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-[#333] rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

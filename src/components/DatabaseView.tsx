import React, { useState } from 'react';
import { 
  Table as TableIcon, Kanban, Plus, MoreHorizontal, Check, Trash2, Calendar, 
  Tag, Search, X, CheckSquare, Type
} from 'lucide-react';
import { Database, DatabaseColumn, DatabaseRow, DatabaseViewType, ColumnType } from '../types';
import { nanoid } from 'nanoid';

interface DatabaseViewProps {
  database: Database;
  onUpdateDatabase: (updated: Database) => void;
}

export const DatabaseView: React.FC<DatabaseViewProps> = ({ database, onUpdateDatabase }) => {
  const [activeView, setActiveView] = useState<DatabaseViewType>(database.view || 'table');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColType, setNewColType] = useState<ColumnType>('text');

  const handleViewChange = (view: DatabaseViewType) => {
    setActiveView(view);
    onUpdateDatabase({ ...database, view });
  };

  const handleAddRow = (statusVal?: string) => {
    const newRowId = 'row-' + nanoid(6);
    const newRow: DatabaseRow = {
      id: newRowId,
      cells: {
        'c-title': 'Untitled item',
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
  const statusOptions = statusCol?.options || [
    { id: 'not-started', label: 'Not Started', color: '#e0e0e0' },
    { id: 'in-progress', label: 'In Progress', color: '#cce2ff' },
    { id: 'done', label: 'Completed', color: '#c3f0c8' },
  ];

  // Filter rows based on search
  const filteredRows = database.rows.filter((row) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return Object.values(row.cells).some((val) =>
      typeof val === 'string' ? val.toLowerCase().includes(query) : false
    );
  });

  return (
    <div className="my-6 border border-[#e9e9e7] dark:border-[#2e2e2e] rounded-xl overflow-hidden bg-white dark:bg-[#202020] shadow-sm">
      {/* Top Database Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 border-b border-[#e9e9e7] dark:border-[#2e2e2e] bg-[#fbfbfa] dark:bg-[#252525] gap-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={database.title}
            onChange={(e) => onUpdateDatabase({ ...database, title: e.target.value })}
            className="font-semibold text-sm bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1.5 py-0.5 text-[#37352f] dark:text-[#ebebeb]"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Filter */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter tasks..."
              className="pl-7 pr-2 py-1 text-xs bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 rounded-md w-32 focus:w-44 transition-all focus:outline-none text-[#37352f] dark:text-[#ebebeb]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* View Switcher Tabs */}
          <div className="flex items-center gap-1 bg-[#efefee] dark:bg-[#1a1a1a] p-1 rounded-lg">
            <button
              onClick={() => handleViewChange('table')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                activeView === 'table'
                  ? 'bg-white dark:bg-[#2e2e2e] text-[#37352f] dark:text-[#ebebeb] shadow-xs'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              Table
            </button>
            <button
              onClick={() => handleViewChange('board')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                activeView === 'board'
                  ? 'bg-white dark:bg-[#2e2e2e] text-[#37352f] dark:text-[#ebebeb] shadow-xs'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              Board
            </button>
          </div>
        </div>
      </div>

      {/* View Content */}
      {activeView === 'table' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
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
                          className="opacity-0 group-hover/colhead:opacity-100 p-0.5 hover:text-red-500 text-gray-400 rounded"
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
                    className="flex items-center gap-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Column</span>
                  </button>
                </th>
                <th className="w-10 px-2 py-2 text-center"></th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, idx) => (
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
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity p-1 rounded"
                      title="Delete row"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Add Row Button */}
          <button
            onClick={() => handleAddRow()}
            className="w-full flex items-center gap-1.5 px-4 py-2 text-xs text-gray-500 dark:text-gray-400 hover:bg-[#efefee] dark:hover:bg-[#282828] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Item</span>
          </button>
        </div>
      ) : (
        /* Board / Kanban View */
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-x-auto min-h-[300px] bg-[#fbfbfa] dark:bg-[#1c1c1c]">
          {statusOptions.map((status) => {
            const columnRows = filteredRows.filter(
              (r) => (r.cells['c-status'] || 'not-started') === status.id
            );

            return (
              <div
                key={status.id}
                className="flex flex-col bg-white dark:bg-[#242424] rounded-lg border border-[#e9e9e7] dark:border-[#2e2e2e] shadow-xs p-2.5 min-w-[220px]"
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
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-[#323232] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Cards List */}
                <div className="flex-1 space-y-2 overflow-y-auto max-h-[360px]">
                  {columnRows.map((row) => (
                    <div
                      key={row.id}
                      className="p-2.5 rounded-md border border-[#e9e9e7] dark:border-[#333333] bg-[#fafafa] dark:bg-[#2a2a2a] hover:shadow-sm transition-all group"
                    >
                      <div className="flex items-start justify-between gap-1 mb-1.5">
                        <input
                          type="text"
                          value={row.cells['c-title'] || ''}
                          onChange={(e) => handleCellChange(row.id, 'c-title', e.target.value)}
                          className="w-full bg-transparent font-medium text-xs text-[#37352f] dark:text-[#ebebeb] focus:outline-none"
                        />
                        <button
                          onClick={() => handleDeleteRow(row.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-[#383838] text-[11px]">
                        {row.cells['c-date'] ? (
                          <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {row.cells['c-date']}
                          </span>
                        ) : (
                          <span className="text-gray-400">No date</span>
                        )}

                        {/* Move card to status dropdown */}
                        <select
                          value={row.cells['c-status'] || 'not-started'}
                          onChange={(e) => handleCellChange(row.id, 'c-status', e.target.value)}
                          className="text-[10px] bg-white dark:bg-[#333333] border border-gray-200 dark:border-gray-600 rounded px-1.5 py-0.5 text-gray-600 dark:text-gray-300"
                        >
                          {statusOptions.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              Move: {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}

                  {columnRows.length === 0 && (
                    <div className="text-center py-6 text-[11px] text-gray-400 border border-dashed border-gray-200 dark:border-[#333333] rounded">
                      No cards
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleAddRow(status.id)}
                  className="mt-2 w-full py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:bg-[#efefee] dark:hover:bg-[#323232] rounded flex items-center justify-center gap-1 transition-colors"
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
                  className="w-full bg-white dark:bg-[#1c1c1c] border border-gray-300 dark:border-[#444] rounded-lg px-2 py-1.5 text-xs text-[#37352f] dark:text-[#ebebeb] focus:outline-none"
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

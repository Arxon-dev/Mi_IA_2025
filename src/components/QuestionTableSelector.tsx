'use client';

import React, { useState } from 'react';
import { 
  QuestionTableName, 
  QuestionTableOption, 
  QUESTION_TABLES, 
  getTablesByCategory 
} from '@/types/questionTables';

interface QuestionTableSelectorProps {
  selectedTable: QuestionTableName;
  onTableChange: (table: QuestionTableName) => void;
  disabled?: boolean;
  className?: string;
}

export default function QuestionTableSelector({
  selectedTable,
  onTableChange,
  disabled = false,
  className = ''
}: QuestionTableSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const tablesByCategory = getTablesByCategory();
  const selectedTableInfo = QUESTION_TABLES.find(t => t.id === selectedTable);
  
  // Filtrar tablas por término de búsqueda
  const filteredCategories = Object.entries(tablesByCategory).reduce((acc, [category, tables]) => {
    const filteredTables = tables.filter(table => 
      table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      table.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (filteredTables.length > 0) {
      acc[category] = filteredTables;
    }
    
    return acc;
  }, {} as Record<string, QuestionTableOption[]>);

  const handleTableSelect = (table: QuestionTableOption) => {
    onTableChange(table.id);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Selector Button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between px-4 py-3 
          border border-gray-300 rounded-lg shadow-sm
          bg-white hover:bg-gray-50 transition-colors
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{selectedTableInfo?.icon || '📝'}</span>
          <div className="text-left">
            <div className="font-medium text-gray-900">
              {selectedTableInfo?.name || 'Seleccionar tabla'}
            </div>
            <div className="text-sm text-gray-500">
              {selectedTableInfo?.description || 'Elige dónde guardar las preguntas'}
            </div>
          </div>
        </div>
        <svg 
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-hidden">
          {/* Search Box */}
          <div className="p-3 border-b border-gray-200">
            <input
              type="text"
              placeholder="Buscar tabla..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Options List */}
          <div className="max-h-80 overflow-y-auto">
            {Object.entries(filteredCategories).map(([category, tables]) => (
              <div key={category}>
                {/* Category Header */}
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700">{category}</h3>
                </div>
                
                {/* Tables in Category */}
                {tables.map((table) => (
                  <button
                    key={table.id}
                    type="button"
                    onClick={() => handleTableSelect(table)}
                    className={`
                      w-full flex items-center space-x-3 px-4 py-3 text-left
                      hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0
                      ${selectedTable === table.id ? 'bg-blue-100 border-blue-200' : ''}
                    `}
                  >
                    <span className="text-2xl">{table.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium truncate ${
                        selectedTable === table.id ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {table.name}
                        {table.isDefault && (
                          <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                            Por defecto
                          </span>
                        )}
                      </div>
                      <div className={`text-sm truncate ${
                        selectedTable === table.id ? 'text-blue-700' : 'text-gray-500'
                      }`}>
                        {table.description}
                      </div>
                    </div>
                    {selectedTable === table.id && (
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            ))}
            
            {Object.keys(filteredCategories).length === 0 && searchTerm && (
              <div className="p-4 text-center text-gray-500">
                No se encontraron tablas que coincidan con "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
} 
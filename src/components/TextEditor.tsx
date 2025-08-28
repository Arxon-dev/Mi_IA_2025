'use client';

import React from 'react';
import { FileText, Type } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TextEditorProps {
  value: string;
  onTextChange: (text: string) => void;
  placeholder?: string;
  label?: string;
  description?: string;
  rows?: number;
  maxLength?: number;
  disabled?: boolean;
  className?: string;
  showCharCount?: boolean;
  showWordCount?: boolean;
}

export function TextEditor({ 
  value, 
  onTextChange,
  placeholder = "Escribe o pega tu texto aquí...",
  label,
  description,
  rows = 8,
  maxLength,
  disabled = false,
  className,
  showCharCount = false,
  showWordCount = false
}: TextEditorProps) {
  const charCount = value.length;
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const isNearLimit = maxLength && charCount > maxLength * 0.9;
  const isOverLimit = maxLength && charCount > maxLength;

  return (
    <div className={cn("w-full space-y-2", className)}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-foreground">
          {label}
        </label>
      )}

      {/* Text Area */}
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          maxLength={maxLength}
          disabled={disabled}
          className={cn(
            "w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted",
            "placeholder:text-muted-foreground transition-colors duration-200",
            "hover:border-border-hover resize-vertical",
            isOverLimit && "border-destructive focus:ring-destructive"
          )}
        />
        
        {/* Icon in top-right corner */}
        <div className="absolute top-2 right-2 opacity-30">
          <Type className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-xs">
        <div className="text-muted-foreground">
          {description}
        </div>
        
        <div className="flex items-center space-x-3 text-muted-foreground">
          {showWordCount && (
            <div className="flex items-center space-x-1">
              <FileText className="w-3 h-3" />
              <span>{wordCount} palabra{wordCount !== 1 ? 's' : ''}</span>
            </div>
          )}
          
          {(showCharCount || maxLength) && (
            <div className={cn(
              "flex items-center space-x-1",
              isNearLimit && "text-yellow-600 dark:text-yellow-400",
              isOverLimit && "text-destructive"
            )}>
              <span>
                {charCount}
                {maxLength && ` / ${maxLength}`}
                {' caracteres'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Error message if over limit */}
      {isOverLimit && (
        <p className="text-xs text-destructive">
          Has excedido el límite de caracteres por {charCount - maxLength!} caracteres
        </p>
      )}
    </div>
  );
} 
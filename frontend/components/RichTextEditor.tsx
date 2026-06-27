'use client';

import React, { useRef, useCallback, useEffect } from 'react';
import { Bold, Italic, Underline, Strikethrough, ListOrdered, List, AlignLeft, AlignCenter, AlignRight, AlignJustify, Link as LinkIcon } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ value, onChange, placeholder, className = '' }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);
  const savedSelectionRef = useRef<Range | null>(null);

  // Set initial content only once on mount
  useEffect(() => {
    if (editorRef.current && !isInitializedRef.current) {
      if (value) {
        editorRef.current.innerHTML = value;
      }
      isInitializedRef.current = true;
    }
  }, []);

  const handleChange = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  // Save the current selection inside the editor
  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current) {
      const range = sel.getRangeAt(0);
      // Only save if the selection is inside our editor
      if (editorRef.current.contains(range.commonAncestorContainer)) {
        savedSelectionRef.current = range.cloneRange();
      }
    }
  }, []);

  // Restore the saved selection
  const restoreSelection = useCallback(() => {
    if (savedSelectionRef.current) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedSelectionRef.current);
      }
    } else {
      // Fallback: focus the editor and place cursor at the end
      editorRef.current?.focus();
    }
  }, []);

  const execCommand = useCallback((command: string, val?: string) => {
    restoreSelection();
    document.execCommand(command, false, val);
    handleChange();
  }, [restoreSelection, handleChange]);

  const insertEmoji = useCallback((emoji: string) => {
    restoreSelection();
    document.execCommand('insertText', false, emoji);
    handleChange();
  }, [restoreSelection, handleChange]);

  // Prevent toolbar buttons from stealing focus from the editor
  // But allow <select> elements to open their dropdown normally
  const handleToolbarMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isSelect = target.tagName === 'SELECT' || target.closest('select');
    if (!isSelect) {
      e.preventDefault();
    }
    saveSelection();
  }, [saveSelection]);

  const emojis = ['👍', '✅', '⚠️', '❌', '📞', '🔧', '⚡', '🏠', '💰', '📋'];

  return (
    <div className={`rich-text-editor ${className}`}>
      {/* Toolbar */}
      <div
        className="flex flex-wrap items-center gap-1 p-2 bg-neutral-100 dark:bg-neutral-600 border border-neutral-300 dark:border-neutral-500 border-b-0 rounded-t-lg"
        onMouseDown={handleToolbarMouseDown}
      >
        {/* Bold, Italic, Underline, Strikethrough */}
        <button type="button" onClick={() => execCommand('bold')} className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-500 rounded text-sm font-bold" title="Negrito"><Bold size={16} /></button>
        <button type="button" onClick={() => execCommand('italic')} className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-500 rounded text-sm italic" title="Itálico"><Italic size={16} /></button>
        <button type="button" onClick={() => execCommand('underline')} className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-500 rounded text-sm underline" title="Sublinhado"><Underline size={16} /></button>
        <button type="button" onClick={() => execCommand('strikeThrough')} className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-500 rounded text-sm line-through" title="Tachado"><Strikethrough size={16} /></button>
        
        <div className="w-px h-5 bg-neutral-300 dark:bg-neutral-500 mx-1"></div>
        
        {/* Font Size */}
        <select
          onChange={(e) => {
            saveSelection();
            execCommand('fontSize', e.target.value);
          }}
          className="px-1 py-0.5 text-xs border rounded bg-white dark:bg-neutral-700 border-neutral-300 dark:border-neutral-500"
          title="Tamanho"
        >
          <option value="2">Normal</option>
          <option value="1">Pequeno</option>
          <option value="3">Médio</option>
          <option value="4">Grande</option>
          <option value="5">Gigante</option>
        </select>

        <div className="w-px h-5 bg-neutral-300 dark:bg-neutral-500 mx-1"></div>

        {/* Lists */}
        <button type="button" onClick={() => execCommand('insertOrderedList')} className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-500 rounded text-xs" title="Lista Numerada"><ListOrdered size={16} /></button>
        <button type="button" onClick={() => execCommand('insertUnorderedList')} className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-500 rounded text-xs" title="Lista com Marcadores"><List size={16} /></button>

        <div className="w-px h-5 bg-neutral-300 dark:bg-neutral-500 mx-1"></div>

        {/* Alignment */}
        <button type="button" onClick={() => execCommand('justifyLeft')} className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-500 rounded text-xs" title="Alinhar Esquerda"><AlignLeft size={16} /></button>
        <button type="button" onClick={() => execCommand('justifyCenter')} className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-500 rounded text-xs" title="Centralizar"><AlignCenter size={16} /></button>
        <button type="button" onClick={() => execCommand('justifyRight')} className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-500 rounded text-xs" title="Alinhar Direita"><AlignRight size={16} /></button>
        <button type="button" onClick={() => execCommand('justifyFull')} className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-500 rounded text-xs" title="Justificar"><AlignJustify size={16} /></button>

        <div className="w-px h-5 bg-neutral-300 dark:bg-neutral-500 mx-1"></div>

        {/* Link */}
        <button type="button" onClick={() => {
          restoreSelection();
          const url = prompt('URL do link:');
          if (url) execCommand('createLink', url);
        }} className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-500 rounded text-xs" title="Inserir Link"><LinkIcon size={16} /></button>

        <div className="w-px h-5 bg-neutral-300 dark:bg-neutral-500 mx-1"></div>

        {/* Emojis */}
        {emojis.map((emoji) => (
          <button key={emoji} type="button" onClick={() => insertEmoji(emoji)} className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-500 rounded text-sm" title={`Inserir ${emoji}`}>
            {emoji}
          </button>
        ))}
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleChange}
        onBlur={handleChange}
        className="w-full min-h-[120px] p-3 border border-neutral-300 dark:border-neutral-500 border-t-0 rounded-b-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 overflow-auto"
        data-placeholder={placeholder || 'Digite suas observações...'}
        style={{ whiteSpace: 'pre-wrap' }}
      />

      <style jsx>{`
        .rich-text-editor [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        .rich-text-editor [contenteditable] ol,
        .rich-text-editor [contenteditable] ul {
          margin-left: 1.5rem;
          padding-left: 0.5rem;
        }
        .rich-text-editor [contenteditable] ol {
          list-style-type: decimal !important;
        }
        .rich-text-editor [contenteditable] ul {
          list-style-type: disc !important;
        }
        .rich-text-editor [contenteditable] li {
          margin-bottom: 0.25rem;
        }
      `}</style>
    </div>
  );
}

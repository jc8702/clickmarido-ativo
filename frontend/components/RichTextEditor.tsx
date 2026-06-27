'use client';

import React, { useRef, useCallback } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ value, onChange, placeholder, className = '' }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleChange();
  };

  const handleChange = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const insertEmoji = (emoji: string) => {
    document.execCommand('insertText', false, emoji);
    editorRef.current?.focus();
    handleChange();
  };

  const emojis = ['👍', '✅', '⚠️', '❌', '📞', '🔧', '⚡', '🏠', '💰', '📋'];

  return (
    <div className={`rich-text-editor ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-neutral-100 dark:bg-neutral-600 border border-neutral-300 dark:border-neutral-500 border-b-0 rounded-t-lg">
        {/* Bold, Italic, Underline */}
        <button type="button" onClick={() => execCommand('bold')} className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-500 rounded text-sm font-bold" title="Negrito">B</button>
        <button type="button" onClick={() => execCommand('italic')} className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-500 rounded text-sm italic" title="Itálico">I</button>
        <button type="button" onClick={() => execCommand('underline')} className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-500 rounded text-sm underline" title="Sublinhado">U</button>
        <button type="button" onClick={() => execCommand('strikeThrough')} className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-500 rounded text-sm line-through" title="Tachado">S</button>
        
        <div className="w-px h-5 bg-neutral-300 dark:bg-neutral-500 mx-1"></div>
        
        {/* Font Size */}
        <select onChange={(e) => execCommand('fontSize', e.target.value)} className="px-1 py-0.5 text-xs border rounded bg-white dark:bg-neutral-700 border-neutral-300 dark:border-neutral-500" title="Tamanho">
          <option value="2">Normal</option>
          <option value="1">Pequeno</option>
          <option value="3">Médio</option>
          <option value="4">Grande</option>
          <option value="5">Gigante</option>
        </select>

        <div className="w-px h-5 bg-neutral-300 dark:bg-neutral-500 mx-1"></div>

        {/* Lists */}
        <button type="button" onClick={() => execCommand('insertOrderedList')} className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-500 rounded text-xs" title="Lista Numerada">1.</button>
        <button type="button" onClick={() => execCommand('insertUnorderedList')} className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-500 rounded text-xs" title="Lista com Marcadores">•</button>

        <div className="w-px h-5 bg-neutral-300 dark:bg-neutral-500 mx-1"></div>

        {/* Alignment */}
        <button type="button" onClick={() => execCommand('justifyLeft')} className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-500 rounded text-xs" title="Alinhar Esquerda">⫷</button>
        <button type="button" onClick={() => execCommand('justifyCenter')} className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-500 rounded text-xs" title="Centralizar">≡</button>
        <button type="button" onClick={() => execCommand('justifyRight')} className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-500 rounded text-xs" title="Alinhar Direita">⫸</button>

        <div className="w-px h-5 bg-neutral-300 dark:bg-neutral-500 mx-1"></div>

        {/* Link */}
        <button type="button" onClick={() => {
          const url = prompt('URL do link:');
          if (url) execCommand('createLink', url);
        }} className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-500 rounded text-xs" title="Inserir Link">🔗</button>

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
        dangerouslySetInnerHTML={{ __html: value }}
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
          list-style-type: decimal;
        }
        .rich-text-editor [contenteditable] ul {
          list-style-type: disc;
        }
      `}</style>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ font: [] }],
    [{ size: ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ align: [] }],
    ['blockquote', 'code-block'],
    ['link', 'image'],
    ['clean'],
  ],
};

const formats = [
  'header',
  'font',
  'size',
  'bold',
  'italic',
  'underline',
  'strike',
  'color',
  'background',
  'list',
  'bullet',
  'align',
  'blockquote',
  'code-block',
  'link',
  'image',
];

export function RichTextEditor({ value, onChange, placeholder, className = '' }: RichTextEditorProps) {
  const [ReactQuill, setReactQuill] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    import('react-quill').then((mod) => {
      setReactQuill(() => mod.default);
      setMounted(true);
    });
  }, []);

  if (!mounted || !ReactQuill) {
    return (
      <div className={`w-full p-2.5 border rounded bg-white dark:bg-neutral-700 border-neutral-300 dark:border-neutral-600 min-h-[120px] ${className}`}>
        <p className="text-neutral-400 text-sm">Carregando editor...</p>
      </div>
    );
  }

  return (
    <div className={`rich-text-editor ${className}`}>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.css"
      />
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder || 'Digite suas observações...'}
      />
    </div>
  );
}

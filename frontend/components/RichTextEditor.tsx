'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

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
  return (
    <div className={`rich-text-editor ${className}`}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder || 'Digite suas observações...'}
        className="bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
      />
      <style jsx>{`
        .rich-text-editor :global(.ql-toolbar) {
          border-color: rgb(209 213 219);
          border-radius: 0.5rem 0.5rem 0 0;
          background-color: rgb(249 250 251);
        }
        .rich-text-editor :global(.dark .ql-toolbar) {
          border-color: rgb(75 85 99);
          background-color: rgb(55 65 81);
        }
        .rich-text-editor :global(.ql-container) {
          border-color: rgb(209 213 219);
          border-radius: 0 0 0.5rem 0.5rem;
          font-size: 0.875rem;
          min-height: 120px;
        }
        .rich-text-editor :global(.dark .ql-container) {
          border-color: rgb(75 85 99);
        }
        .rich-text-editor :global(.ql-editor) {
          min-height: 120px;
          color: rgb(17 24 39);
        }
        .rich-text-editor :global(.dark .ql-editor) {
          color: rgb(243 244 246);
        }
        .rich-text-editor :global(.ql-editor.ql-blank::before) {
          color: rgb(156 163 175);
        }
        .rich-text-editor :global(.dark .ql-editor.ql-blank::before) {
          color: rgb(156 163 175);
        }
      `}</style>
    </div>
  );
}

'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import { useEffect, useCallback } from 'react';

const TEXT_COLORS = [
  { label: 'Default', value: '' },
  { label: 'Black', value: '#000000' },
  { label: 'Dark Gray', value: '#333333' },
  { label: 'Gray', value: '#666666' },
  { label: 'Brown', value: '#7c4700' },
  { label: 'Gold', value: '#ac8545' },
  { label: 'Green', value: '#1a7a3b' },
  { label: 'Red', value: '#cc2200' },
  { label: 'Blue', value: '#0057b8' },
];

const HIGHLIGHT_COLORS = [
  { label: 'None', value: '' },
  { label: 'Yellow', value: '#fff176' },
  { label: 'Green', value: '#c8e6c9' },
  { label: 'Blue', value: '#bbdefb' },
  { label: 'Pink', value: '#f8bbd0' },
  { label: 'Orange', value: '#ffe0b2' },
];

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
};

export default function RichTextEditor({ value, onChange, placeholder, minHeight = 160 }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer' } }),
    ],
    content: value || '',
    onUpdate({ editor }) {
      const html = editor.getHTML();
      onChange(html === '<p></p>' ? '' : html);
    },
    editorProps: {
      attributes: {
        class: 'rich-editor-content',
        'data-placeholder': placeholder || 'লিখতে শুরু করুন...',
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== value && value !== undefined) {
      editor.commands.setContent(value || '');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleSetLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href || '';
    const url = window.prompt('Link URL:', prev);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  }, [editor]);

  if (!editor) return null;

  const btn = (active: boolean, onClick: () => void, title: string, children: React.ReactNode) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{
        background: active ? 'rgba(74,158,255,0.25)' : 'rgba(255,255,255,0.06)',
        border: active ? '1px solid rgba(74,158,255,0.5)' : '1px solid rgba(255,255,255,0.1)',
        color: active ? '#4a9eff' : 'rgba(255,255,255,0.75)',
        borderRadius: 5,
        padding: '4px 8px',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 600,
        lineHeight: 1,
        minWidth: 30,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </button>
  );

  const sep = () => <div style={{ width: 1, background: 'rgba(255,255,255,0.1)', margin: '0 2px', alignSelf: 'stretch' }} />;

  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, overflow: 'hidden', background: 'rgba(255,255,255,0.04)' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4, padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)' }}>

        {/* Headings */}
        {btn(editor.isActive('heading', { level: 1 }), () => editor.chain().focus().toggleHeading({ level: 1 }).run(), 'Heading 1', <span style={{ fontSize: 12 }}>H1</span>)}
        {btn(editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), 'Heading 2', <span style={{ fontSize: 12 }}>H2</span>)}
        {btn(editor.isActive('heading', { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run(), 'Heading 3', <span style={{ fontSize: 12 }}>H3</span>)}

        {sep()}

        {/* Text styles */}
        {btn(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), 'Bold', <b>B</b>)}
        {btn(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), 'Italic', <i>I</i>)}
        {btn(editor.isActive('strike'), () => editor.chain().focus().toggleStrike().run(), 'Strikethrough', <s>S</s>)}

        {sep()}

        {/* Lists */}
        {btn(editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), 'Bullet List',
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none"/></svg>
        )}
        {btn(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), 'Numbered List',
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><text x="2" y="8" fontSize="7" fill="currentColor" stroke="none" fontWeight="bold">1</text><text x="2" y="14" fontSize="7" fill="currentColor" stroke="none" fontWeight="bold">2</text><text x="2" y="20" fontSize="7" fill="currentColor" stroke="none" fontWeight="bold">3</text></svg>
        )}
        {btn(editor.isActive('blockquote'), () => editor.chain().focus().toggleBlockquote().run(), 'Blockquote',
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1zm12 0c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>
        )}

        {sep()}

        {/* Link */}
        {btn(editor.isActive('link'), handleSetLink, 'Link',
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
        )}

        {sep()}

        {/* Text Color */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <label title="Text Color" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 5, padding: '4px 7px', fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>
            <span style={{ borderBottom: `2px solid ${editor.getAttributes('textStyle').color || 'rgba(255,255,255,0.5)'}`, paddingBottom: 1 }}>A</span>
            <select
              title="Text Color"
              style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer', width: '100%' }}
              value={editor.getAttributes('textStyle').color || ''}
              onChange={e => {
                if (e.target.value) {
                  editor.chain().focus().setColor(e.target.value).run();
                } else {
                  editor.chain().focus().unsetColor().run();
                }
              }}
            >
              {TEXT_COLORS.map(c => (
                <option key={c.value} value={c.value} style={{ background: '#1a1a2e', color: '#fff' }}>{c.label}</option>
              ))}
            </select>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M5 7L1 3h8z"/></svg>
          </label>
        </div>

        {/* Highlight Color */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <label title="Highlight Color" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, background: editor.isActive('highlight') ? 'rgba(74,158,255,0.25)' : 'rgba(255,255,255,0.06)', border: editor.isActive('highlight') ? '1px solid rgba(74,158,255,0.5)' : '1px solid rgba(255,255,255,0.1)', borderRadius: 5, padding: '4px 7px', fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>
            <span style={{ background: '#fff176', color: '#000', padding: '0 2px', borderRadius: 2 }}>H</span>
            <select
              title="Highlight Color"
              style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer', width: '100%' }}
              value={editor.getAttributes('highlight').color || ''}
              onChange={e => {
                if (e.target.value) {
                  editor.chain().focus().setHighlight({ color: e.target.value }).run();
                } else {
                  editor.chain().focus().unsetHighlight().run();
                }
              }}
            >
              {HIGHLIGHT_COLORS.map(c => (
                <option key={c.value} value={c.value} style={{ background: '#1a1a2e', color: '#fff' }}>{c.label}</option>
              ))}
            </select>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M5 7L1 3h8z"/></svg>
          </label>
        </div>

        {sep()}

        {btn(false, () => editor.chain().focus().clearNodes().unsetAllMarks().run(), 'Clear Formatting',
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        )}
      </div>

      {/* Editor Area */}
      <EditorContent editor={editor} />

      <style>{`
        .rich-editor-content {
          min-height: ${minHeight}px;
          padding: 12px 14px;
          color: rgba(255,255,255,0.85);
          font-size: 14px;
          line-height: 1.7;
          outline: none;
        }
        .rich-editor-content h1 { font-size: 22px; font-weight: 700; margin: 0 0 10px 0; }
        .rich-editor-content h2 { font-size: 18px; font-weight: 700; margin: 0 0 8px 0; }
        .rich-editor-content h3 { font-size: 15px; font-weight: 700; margin: 0 0 6px 0; }
        .rich-editor-content p { margin: 0 0 8px 0; }
        .rich-editor-content p:last-child { margin-bottom: 0; }
        .rich-editor-content ul { padding-left: 20px; margin: 6px 0; list-style: disc; }
        .rich-editor-content ol { padding-left: 20px; margin: 6px 0; list-style: decimal; }
        .rich-editor-content li { margin-bottom: 4px; }
        .rich-editor-content strong { font-weight: 700; }
        .rich-editor-content em { font-style: italic; }
        .rich-editor-content s { text-decoration: line-through; }
        .rich-editor-content mark { padding: 1px 2px; border-radius: 2px; }
        .rich-editor-content blockquote { border-left: 3px solid rgba(255,255,255,0.2); padding-left: 12px; margin: 8px 0; color: rgba(255,255,255,0.5); font-style: italic; }
        .rich-editor-content a { color: #4a9eff; text-decoration: underline; }
        .ProseMirror:focus { outline: none; }
        .ProseMirror p.is-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: rgba(255,255,255,0.25);
          pointer-events: none;
          height: 0;
        }
      `}</style>
    </div>
  );
}

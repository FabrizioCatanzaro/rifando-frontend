'use client';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import CharacterCount from '@tiptap/extension-character-count';
import Placeholder from '@tiptap/extension-placeholder';
import { useCallback } from 'react';
import {
  Bold, Italic, Link2, List, ListOrdered,
  Heading1, Heading2, Heading3, Quote, Minus,
} from 'lucide-react';

const CHAR_LIMIT = 6000;

interface RichTextEditorProps {
  content?: Record<string, unknown> | null;
  onChange?: (json: Record<string, unknown>) => void;
}

function ToolbarButton({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className={`p-1.5 rounded transition-colors ${
        active
          ? 'bg-violet-600 text-white'
          : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700'
      }`}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false,
        code: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' },
      }),
      Placeholder.configure({
        placeholder: 'Escribí las condiciones, métodos de entrega o cualquier información relevante para los participantes...',
      }),
      CharacterCount.configure({ limit: CHAR_LIMIT }),
    ],
    content: content ?? undefined,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON() as Record<string, unknown>);
    },
    editorProps: {
      attributes: {
        class: 'outline-none min-h-[220px] px-4 py-3 text-sm text-zinc-200 leading-relaxed',
      },
    },
    immediatelyRender: false,
  });

  const handleLink = useCallback(() => {
    if (!editor) return;
    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const url = window.prompt('URL del enlace:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  if (!editor) return null;

  const chars = editor.storage.characterCount.characters();
  const pct = Math.round((chars / CHAR_LIMIT) * 100);

  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-950 overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-zinc-800 px-2 py-1.5 bg-zinc-900">
        <ToolbarButton
          active={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="Título grande"
        >
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Título mediano"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Subtítulo"
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>

        <span className="w-px h-5 bg-zinc-700 mx-1" />

        <ToolbarButton
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Negrita"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Itálica"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('link')}
          onClick={handleLink}
          title="Enlace"
        >
          <Link2 className="h-4 w-4" />
        </ToolbarButton>

        <span className="w-px h-5 bg-zinc-700 mx-1" />

        <ToolbarButton
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Lista"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Lista numerada"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Cita"
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          active={false}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Separador"
        >
          <Minus className="h-4 w-4" />
        </ToolbarButton>
      </div>

      {/* Editor area */}
      <EditorContent editor={editor} className="rich-text-content" />

      {/* Character count */}
      <div className="flex justify-end px-4 py-1.5 border-t border-zinc-800">
        <span className={`text-xs ${pct >= 90 ? 'text-amber-400' : 'text-zinc-600'}`}>
          {chars} / {CHAR_LIMIT}
        </span>
      </div>
    </div>
  );
}

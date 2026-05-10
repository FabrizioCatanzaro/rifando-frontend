'use client';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';

interface RichTextViewProps {
  content: Record<string, unknown> | null | undefined;
}

export function RichTextView({ content }: RichTextViewProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false,
        code: false,
      }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer', class: 'text-violet-400 underline hover:text-violet-300' },
      }),
    ],
    content: content ?? undefined,
    editable: false,
    editorProps: {
      attributes: {
        class: 'outline-none',
      },
    },
    immediatelyRender: false,
  });

  if (!editor) return null;

  return <EditorContent editor={editor} className="rich-text-content" />;
}

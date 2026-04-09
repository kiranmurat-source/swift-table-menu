import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { useEffect } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  rightSlot?: React.ReactNode; // optional button (e.g. AI) overlay on the right side of toolbar
}

const S = {
  wrapper: {
    border: '1px solid #e5e7eb',
    borderRadius: 6,
    background: '#ffffff',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    padding: 4,
    background: '#f5f5f4',
    borderBottom: '1px solid #e5e7eb',
    flexWrap: 'wrap' as const,
  },
  btn: {
    width: 28,
    height: 28,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    background: 'transparent',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    color: '#44403c',
    padding: 0,
  },
  btnActive: {
    background: '#e5e7eb',
    color: '#1c1917',
  },
  btnClear: {
    width: 'auto' as const,
    padding: '0 8px',
    fontSize: 11,
    fontWeight: 500,
    color: '#78716c',
  },
  separator: {
    width: 1,
    height: 18,
    background: '#d6d3d1',
    margin: '0 4px',
  },
  content: {
    padding: 12,
    fontSize: 14,
    fontFamily: "'Inter', sans-serif",
    lineHeight: 1.5,
    color: '#1c1917',
    outline: 'none',
  },
};

function ToolbarButton({
  onClick,
  active,
  title,
  children,
  extraStyle,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
  extraStyle?: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      style={{ ...S.btn, ...(active ? S.btnActive : {}), ...(extraStyle || {}) }}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor, rightSlot }: { editor: Editor; rightSlot?: React.ReactNode }) {
  return (
    <div style={S.toolbar}>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        title="Bold"
        extraStyle={{ fontWeight: 700 }}
      >
        B
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        title="Italic"
        extraStyle={{ fontStyle: 'italic' }}
      >
        I
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive('underline')}
        title="Underline"
        extraStyle={{ textDecoration: 'underline' }}
      >
        U
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive('strike')}
        title="Strikethrough"
        extraStyle={{ textDecoration: 'line-through' }}
      >
        S
      </ToolbarButton>

      <span style={S.separator} />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        title="Bullet list"
      >
        •
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
        title="Ordered list"
      >
        1.
      </ToolbarButton>

      <span style={S.separator} />

      <ToolbarButton
        onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
        title="Formatlamayı temizle"
        extraStyle={S.btnClear}
      >
        Temizle
      </ToolbarButton>

      {rightSlot && (
        <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center' }}>
          {rightSlot}
        </span>
      )}
    </div>
  );
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder,
  minHeight = 80,
  rightSlot,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        code: false,
        blockquote: false,
        horizontalRule: false,
      }),
      Underline,
      Placeholder.configure({
        placeholder: placeholder || '',
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // Tiptap returns "<p></p>" for empty — normalize to empty string
      onChange(html === '<p></p>' ? '' : html);
    },
  });

  // Sync external content changes (e.g. when switching between items)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const incoming = content || '';
    // Avoid resetting while user is typing (same content)
    if (incoming !== current && incoming !== (current === '<p></p>' ? '' : current)) {
      editor.commands.setContent(incoming, { emitUpdate: false });
    }
  }, [content, editor]);

  if (!editor) {
    return (
      <div style={{ ...S.wrapper, minHeight: minHeight + 40 }}>
        <div style={S.toolbar} />
        <div style={{ ...S.content, minHeight }} />
      </div>
    );
  }

  return (
    <div style={S.wrapper}>
      <Toolbar editor={editor} rightSlot={rightSlot} />
      <EditorContent
        editor={editor}
        style={{ ...S.content, minHeight }}
        className="rich-text-editor-content"
      />
    </div>
  );
}

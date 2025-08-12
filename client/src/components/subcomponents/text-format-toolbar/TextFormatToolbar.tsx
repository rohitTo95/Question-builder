import React, { useState, useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import FloatingToolbar from "../text-formating-tools/TextFormatingToolbar";

interface TextFormatingToolsProps {
  value: string;
  onChange: (value: string) => void;
  onTextSelect?: (text: string) => void;
}

const TextFormatingTools = ({ value, onChange, onTextSelect }: TextFormatingToolsProps) => {
  const [toolbarVisibility, setToolbarVisibility] = useState<boolean>(false);
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sync editor content with value prop changes
  useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  // Detect selected text
  useEffect(() => {
    if (!editor) {
      setToolbarVisibility(false);
      return;
    }

    const handleSelectionUpdate = ({ editor }: { editor: any }) => {
      const { from, to } = editor.state.selection;
      if (from !== to) {
        const selectedText = editor.state.doc.textBetween(from, to, " ");
        onTextSelect?.(selectedText);
        setToolbarVisibility(true);
      } else {
        // Hide toolbar when no text is selected
        setToolbarVisibility(false);
      }
    };

    // Add event listener
    editor.on("selectionUpdate", handleSelectionUpdate);

    // Cleanup function to remove event listener
    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate);
    };
  }, [editor, onTextSelect]);

  return (
    <div className="relative">
      {editor && <FloatingToolbar editor={editor} visibility={toolbarVisibility} />}
      <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm">
        <EditorContent 
          editor={editor} 
          className="w-full min-h-[1.5rem] focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:border-none [&_.ProseMirror]:p-0 [&_.ProseMirror]:m-0 [&_.ProseMirror]:min-h-[1.5rem]" 
        />
      </div>
    </div>
  );
};

export default TextFormatingTools;

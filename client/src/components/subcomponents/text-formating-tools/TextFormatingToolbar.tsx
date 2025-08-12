import { Editor } from "@tiptap/react";
import { Bold, Italic, Underline } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FloatingToolbarProps {
  editor: Editor | null;
  visibility?: boolean;
}

const FloatingToolbar = ({ editor, visibility = false }: FloatingToolbarProps) => {
  if (!editor) return null;

  return (
    <div className={`${visibility ? 'flex' :'hidden'} items-center gap-1 bg-white border border-gray-200 rounded-lg shadow-md px-[0.7rem] py-[.5rem] absolute -top-14`}>
      <Button
        onClick={() => editor.chain().focus().toggleMark('bold').run()}
        variant="ghost"
        size="sm"
        className={`p-1 h-8 w-8 ${
          editor.isActive("bold") ? "bg-gray-200 text-blue-600" : ""
        }`}
      >
        <Bold size={14} />
      </Button>

      <Button
        onClick={() => editor.chain().focus().toggleMark('italic').run()}
        variant="ghost"
        size="sm"
        className={`p-1 h-8 w-8 ${
          editor.isActive("italic") ? "bg-gray-200 text-blue-600" : ""
        }`}
      >
        <Italic size={14} />
      </Button>

      <Button
        onClick={() => editor.chain().focus().toggleMark('underline').run()}
        variant="ghost"
        size="sm"
        className={`p-1 h-8 w-8 ${
          editor.isActive("underline") ? "bg-gray-200 text-blue-600" : ""
        }`}
      >
        <Underline size={14} />
      </Button>
    </div>
  );
};

export default FloatingToolbar;

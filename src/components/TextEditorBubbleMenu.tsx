import { Editor, BubbleMenu } from "@tiptap/react";
import { useState } from "react";

interface TextEditorBubbleMenuProps {
  editor: Editor;
}

export function TextEditorBubbleMenu({ editor }: TextEditorBubbleMenuProps) {
  const [inputValue, setInputValue] = useState("16");
  const [fontSize, setFontSize] = useState("16");

  const handleFontSizeChange = (size: string) => {
    const sizeNumber = parseInt(size);
    if (!isNaN(sizeNumber) && sizeNumber > 0) {
      setFontSize(size);
      editor.chain().focus().setFontSize(`${size}px`).run();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleFontSizeChange(inputValue);
    }
  };

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{
        placement: "top",
        offset: [0, 8],
        appendTo: () => document.body,
      }}
      className="bg-white shadow-lg rounded-lg p-2 flex gap-2 z-50 items-center"
    >
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`px-2 py-1 rounded ${
          editor.isActive("bold") ? "bg-gray-200" : "hover:bg-gray-100"
        }`}
      >
        B
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`px-2 py-1 rounded ${
          editor.isActive("italic") ? "bg-gray-200" : "hover:bg-gray-100"
        }`}
      >
        I
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`px-2 py-1 rounded ${
          editor.isActive("strike") ? "bg-gray-200" : "hover:bg-gray-100"
        }`}
      >
        S
      </button>
      <div className="relative flex items-center gap-1">
        <input
          type="number"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => setInputValue(fontSize)}
          className="w-14 px-1 py-1 border rounded text-sm"
          min="1"
          max="200"
        />
        <span className="text-sm text-gray-500">px</span>
      </div>
    </BubbleMenu>
  );
}

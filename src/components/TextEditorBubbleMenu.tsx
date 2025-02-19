import { Editor, BubbleMenu } from "@tiptap/react";
import { useState } from "react";

interface TextEditorBubbleMenuProps {
  editor: Editor;
}

const FONT_FAMILIES = [
  { label: "Inter", value: "Inter" },
  { label: "Comic Sans", value: "Comic Sans MS, Comic Sans" },
  { label: "Exo 2", value: "Exo 2" },
  { label: "Serif", value: "serif" },
  { label: "Monospace", value: "monospace" },
  { label: "Cursive", value: "cursive" },
];

export function TextEditorBubbleMenu({ editor }: TextEditorBubbleMenuProps) {
  const [inputValue, setInputValue] = useState("16");
  const [fontSize, setFontSize] = useState("16");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [currentColor, setCurrentColor] = useState("#000000");
  const [currentFont, setCurrentFont] = useState("Inter");
  const [showFontDropdown, setShowFontDropdown] = useState(false);

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
      {/* <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`px-2 py-1 rounded ${
          editor.isActive("strike") ? "bg-gray-200" : "hover:bg-gray-100"
        }`}
      >
        S
      </button> */}
      <div className="relative">
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className={`px-2 py-1 rounded hover:bg-gray-100 flex items-center`}
        >
          <span
            className="w-4 h-4 border border-gray-300 rounded-full"
            style={{
              backgroundColor:
                editor.getAttributes("textStyle").color || currentColor,
            }}
          />
        </button>
        {showColorPicker && (
          <div className="absolute top-full left-0 mt-1 bg-white shadow-lg rounded-lg p-2">
            <input
              type="color"
              value={currentColor}
              onChange={(e) => {
                const newColor = e.target.value;
                setCurrentColor(newColor);
                editor.chain().focus().setColor(newColor).run();
              }}
              className="w-8 h-8 cursor-pointer"
            />
          </div>
        )}
      </div>
      <div className="relative">
        <button
          onClick={() => setShowFontDropdown(!showFontDropdown)}
          className="border rounded px-2 py-1 text-sm flex items-center gap-1"
          style={{ fontFamily: currentFont }}
        >
          {FONT_FAMILIES.find((f) => f.value === currentFont)?.label || "Font"}
        </button>

        {showFontDropdown && (
          <>
            <div
              className="fixed inset-0"
              onClick={() => setShowFontDropdown(false)}
            />
            <div className="absolute left-0 top-full mt-1 bg-white shadow-lg rounded-lg py-1 z-50 min-w-[150px]">
              {FONT_FAMILIES.map((font) => (
                <button
                  key={font.value}
                  onClick={() => {
                    editor.chain().focus().setFontFamily(font.value).run();
                    setCurrentFont(font.value);
                    setShowFontDropdown(false);
                  }}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-100 ${
                    editor.isActive("textStyle", { fontFamily: font.value })
                      ? "bg-gray-100"
                      : ""
                  }`}
                  style={{ fontFamily: font.value }}
                >
                  {font.label}
                </button>
              ))}
              <button
                onClick={() => {
                  editor.chain().focus().unsetFontFamily().run();
                  setCurrentFont("");
                  setShowFontDropdown(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-gray-100 border-t"
              >
                Unset Font
              </button>
            </div>
          </>
        )}
      </div>
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

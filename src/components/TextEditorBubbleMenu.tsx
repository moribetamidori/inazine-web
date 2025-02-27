import { Editor, BubbleMenu } from "@tiptap/react";
import { useState, useEffect } from "react";

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
  const getFontSize = () => {
    const fontSize = editor.getAttributes("textStyle").fontSize;
    return fontSize ? fontSize.replace("px", "") : "28";
  };

  const getCurrentFont = () => {
    return editor.getAttributes("textStyle").fontFamily || "Inter";
  };

  const [inputValue, setInputValue] = useState(getFontSize);
  const [fontSize, setFontSize] = useState(getFontSize);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [currentColor, setCurrentColor] = useState("#000000");
  const [currentFont, setCurrentFont] = useState(getCurrentFont);
  const [showFontDropdown, setShowFontDropdown] = useState(false);

  // Update state when selection changes
  useEffect(() => {
    const updateState = () => {
      // Update font size
      const newSize = getFontSize();
      setFontSize(newSize);
      setInputValue(newSize);

      // Update font family
      const fontFamily = getCurrentFont();
      setCurrentFont(fontFamily);

      // Update color
      const color = editor.getAttributes("textStyle").color || "#000000";
      setCurrentColor(color);
    };

    editor.on("selectionUpdate", updateState);
    editor.on("transaction", updateState);

    return () => {
      editor.off("selectionUpdate", updateState);
      editor.off("transaction", updateState);
    };
  }, [editor]);

  const handleFontSizeChange = (size: string) => {
    const sizeNumber = parseInt(size);
    if (!isNaN(sizeNumber) && sizeNumber > 0) {
      setFontSize(size);

      // Combine with existing attributes
      const attrs = editor.getAttributes("textStyle");
      editor.chain().focus().setFontSize(`${size}px`).run();

      // Ensure font family is preserved
      if (attrs.fontFamily) {
        editor.chain().focus().setFontFamily(attrs.fontFamily).run();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleFontSizeChange(inputValue);
    }
  };

  // Apply a combined style change that preserves all attributes
  const applyStyleChange = (styleChange: () => void) => {
    // Save current text style attributes
    const currentAttrs = editor.getAttributes("textStyle");

    // Apply the requested style change
    styleChange();

    // Re-apply all text style attributes to ensure they're not lost
    // Wait a tiny bit to ensure the style change has been processed
    setTimeout(() => {
      if (currentAttrs.fontFamily) {
        editor.chain().focus().setFontFamily(currentAttrs.fontFamily).run();
      }
      if (currentAttrs.fontSize) {
        editor.chain().focus().setFontSize(currentAttrs.fontSize).run();
      }
      if (currentAttrs.color) {
        editor.chain().focus().setColor(currentAttrs.color).run();
      }
    }, 20);
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
        onClick={() =>
          applyStyleChange(() => editor.chain().focus().toggleBold().run())
        }
        className={`px-2 py-1 rounded ${
          editor.isActive("bold") ? "bg-gray-200" : "hover:bg-gray-100"
        }`}
        style={{ fontFamily: currentFont }}
      >
        B
      </button>
      <button
        onClick={() =>
          applyStyleChange(() => editor.chain().focus().toggleItalic().run())
        }
        className={`px-2 py-1 rounded ${
          editor.isActive("italic") ? "bg-gray-200" : "hover:bg-gray-100"
        }`}
        style={{ fontFamily: currentFont }}
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
      <div className="flex gap-1 border-l border-gray-200 pl-2">
        <button
          onClick={() =>
            applyStyleChange(() =>
              editor.chain().focus().setTextAlign("left").run()
            )
          }
          className={`px-2 py-1 rounded ${
            editor.isActive({ textAlign: "left" })
              ? "bg-gray-200"
              : "hover:bg-gray-100"
          }`}
          title="Align Left"
        >
          ←
        </button>
        <button
          onClick={() =>
            applyStyleChange(() =>
              editor.chain().focus().setTextAlign("center").run()
            )
          }
          className={`px-2 py-1 rounded ${
            editor.isActive({ textAlign: "center" })
              ? "bg-gray-200"
              : "hover:bg-gray-100"
          }`}
          title="Align Center"
        >
          ↔
        </button>
        <button
          onClick={() =>
            applyStyleChange(() =>
              editor.chain().focus().setTextAlign("right").run()
            )
          }
          className={`px-2 py-1 rounded ${
            editor.isActive({ textAlign: "right" })
              ? "bg-gray-200"
              : "hover:bg-gray-100"
          }`}
          title="Align Right"
        >
          →
        </button>
      </div>
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
                applyStyleChange(() =>
                  editor.chain().focus().setColor(newColor).run()
                );
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
                    // Apply font while preserving other styles
                    applyStyleChange(() => {
                      editor.chain().focus().setFontFamily(font.value).run();
                    });
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

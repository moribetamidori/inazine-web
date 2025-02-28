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
    const fontFamily = editor.getAttributes("textStyle").fontFamily;
    return fontFamily || "Inter";
  };

  const [inputValue, setInputValue] = useState(getFontSize);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [currentColor, setCurrentColor] = useState("#000000");
  const [currentFont, setCurrentFont] = useState(getCurrentFont);
  const [showFontDropdown, setShowFontDropdown] = useState(false);

  // Update state when selection changes
  useEffect(() => {
    const updateState = () => {
      // Update font size
      const newSize = getFontSize();
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
      setInputValue(size);
      editor.chain().focus().setFontSize(`${size}px`).run();
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
    if (currentAttrs.fontFamily) {
      editor.chain().focus().setFontFamily(currentAttrs.fontFamily).run();
    }
    if (currentAttrs.fontSize) {
      editor.chain().focus().setFontSize(currentAttrs.fontSize).run();
    }
    if (currentAttrs.color) {
      editor.chain().focus().setColor(currentAttrs.color).run();
    }
  };

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor, state }) => {
        return (
          editor.isFocused &&
          !state.selection.empty &&
          document.activeElement === editor.view.dom
        );
      }}
      className="bg-white shadow-xl rounded-lg p-4 flex gap-4 z-[99999] items-center scale-150"
      updateDelay={0}
    >
      <button
        onClick={() =>
          applyStyleChange(() => editor.chain().focus().toggleBold().run())
        }
        className={`px-4 py-3 rounded text-xl ${
          editor.isActive("bold") ? "bg-gray-200" : "hover:bg-gray-100"
        }`}
      >
        B
      </button>
      <button
        onClick={() =>
          applyStyleChange(() => editor.chain().focus().toggleItalic().run())
        }
        className={`px-4 py-3 rounded text-xl ${
          editor.isActive("italic") ? "bg-gray-200" : "hover:bg-gray-100"
        }`}
      >
        I
      </button>
      <div className="flex gap-1 border-l border-gray-200 pl-2">
        <button
          onClick={() =>
            applyStyleChange(() =>
              editor.chain().focus().setTextAlign("left").run()
            )
          }
          className={`px-4 py-3 rounded text-xl ${
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
          className={`px-4 py-3 rounded text-xl ${
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
          className={`px-4 py-3 rounded text-xl ${
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
          className={`px-4 py-3 rounded text-xl hover:bg-gray-100 flex items-center`}
        >
          <span
            className="w-6 h-6 border border-gray-300 rounded-full"
            style={{
              backgroundColor:
                editor.getAttributes("textStyle").color || currentColor,
            }}
          />
        </button>
        {showColorPicker && (
          <div className="absolute top-full left-0 mt-1 bg-white shadow-lg rounded-lg p-2 z-[10000]">
            <input
              type="color"
              value={currentColor}
              onChange={(e) => {
                const newColor = e.target.value;
                setCurrentColor(newColor);
                editor.chain().focus().setColor(newColor).run();
              }}
              className="w-12 h-12 cursor-pointer"
            />
          </div>
        )}
      </div>
      <div className="relative">
        <button
          onClick={() => setShowFontDropdown(!showFontDropdown)}
          className="border rounded px-4 py-3 text-xl flex items-center gap-1 min-w-[150px]"
          style={{ fontFamily: currentFont }}
        >
          {FONT_FAMILIES.find((f) => f.value === currentFont)?.label ||
            currentFont}
        </button>

        {showFontDropdown && (
          <>
            <div
              className="fixed inset-0 z-[9999]"
              onClick={() => setShowFontDropdown(false)}
            />
            <div className="absolute left-0 top-full mt-1 bg-white shadow-lg rounded-lg py-1 z-[10000] min-w-[180px]">
              {FONT_FAMILIES.map((font) => (
                <button
                  key={font.value}
                  onClick={() => {
                    editor.chain().focus().setFontFamily(font.value).run();
                    setCurrentFont(font.value);
                    setShowFontDropdown(false);
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-100 text-xl ${
                    currentFont === font.value ? "bg-gray-100" : ""
                  }`}
                  style={{ fontFamily: font.value }}
                >
                  {font.label}
                </button>
              ))}
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
          onBlur={() => handleFontSizeChange(inputValue)}
          className="w-20 px-2 py-2 border rounded text-lg"
          min="1"
          max="200"
        />
        <span className="text-lg text-gray-500">px</span>
      </div>
    </BubbleMenu>
  );
}

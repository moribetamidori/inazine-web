import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextStyle from "@tiptap/extension-text-style";
import { FontSize } from "@tiptap/extension-font-size";
import { Color } from "@tiptap/extension-color";
import { FontFamily } from "@tiptap/extension-font-family";
import TextAlign from "@tiptap/extension-text-align";
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "prosemirror-state";

interface UseZineEditorProps {
  content: string;
  isEditing: boolean;
  elementId: string;
  elementType: string;
  onUpdateContent: (id: string, content: string) => void;
  onEditingEnd?: () => void;
}

// Create a custom extension to handle font styling
const FontHandlerExtension = Extension.create({
  name: "fontHandler",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("fontHandler"),
        appendTransaction: (transactions, oldState, newState) => {
          // Skip if no transactions
          if (!transactions.some((tr) => tr.docChanged)) return null;

          // Get the transaction
          const tr = newState.tr;
          let modified = false;

          // Find text nodes that have style changes but lost font family
          newState.doc.descendants((node, pos) => {
            if (node.type.name === "text") {
              const marks = node.marks;
              const hasStyle = marks.some(
                (mark) =>
                  mark.type.name === "bold" || mark.type.name === "italic"
              );
              const hasFontFamily = marks.some(
                (mark) =>
                  mark.type.name === "textStyle" && mark.attrs.fontFamily
              );

              // Check if this node was in a transaction that changed
              const wasInTransaction = transactions.some((transaction) => {
                interface StepWithFrom {
                  from: number;
                }
                interface StepWithPos {
                  pos: number;
                }

                const positions = transaction.steps
                  .map((step) => {
                    if ("from" in step) {
                      return (step as StepWithFrom).from;
                    } else if ("pos" in step) {
                      return (step as StepWithPos).pos;
                    }
                    return null;
                  })
                  .filter((p): p is number => p !== null);

                return positions.some(
                  (p) => p >= pos && p <= pos + node.nodeSize
                );
              });

              // Only process nodes that were part of transactions
              if (hasStyle && !hasFontFamily && wasInTransaction) {
                // Try to find font family from previous state
                const oldNode = oldState.doc.nodeAt(pos);
                if (oldNode) {
                  const oldFontFamily = oldNode.marks.find(
                    (mark) =>
                      mark.type.name === "textStyle" && mark.attrs.fontFamily
                  )?.attrs.fontFamily;

                  if (oldFontFamily) {
                    // Preserve font family
                    const textStyleMark =
                      newState.schema.marks.textStyle.create({
                        fontFamily: oldFontFamily,
                      });
                    tr.addMark(pos, pos + node.nodeSize, textStyleMark);
                    modified = true;
                  }
                }
              }
            }
          });

          return modified ? tr : null;
        },
      }),
    ];
  },
});

export function useZineEditor({
  content,
  isEditing,
  elementId,
  elementType,
  onUpdateContent,
  onEditingEnd,
}: UseZineEditorProps) {
  return useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
      }),
      TextStyle.configure({
        HTMLAttributes: {
          class: "text-style",
        },
      }),
      FontSize.configure({
        types: ["textStyle"],
      }),
      Color.configure({
        types: ["textStyle"],
      }),
      FontFamily.configure({
        types: ["textStyle"],
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right"],
      }),
      FontHandlerExtension,
    ],
    content,
    editable: isEditing,
    onCreate: ({ editor }) => {
      if (elementType === "text") {
        onUpdateContent(elementId, editor.getHTML());
      }
    },
    onUpdate: ({ editor }) => {
      if (elementType === "text") {
        onUpdateContent(elementId, editor.getHTML());
      }
    },
    onBlur: ({ editor }) => {
      if (onEditingEnd) {
        onEditingEnd();
      }
      onUpdateContent(elementId, editor.getHTML());
    },
  });
}

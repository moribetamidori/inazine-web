import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextStyle from "@tiptap/extension-text-style";
import { FontSize } from "@tiptap/extension-font-size";
import { Color } from "@tiptap/extension-color";
import { FontFamily } from "@tiptap/extension-font-family";
import TextAlign from "@tiptap/extension-text-align";
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "prosemirror-state";
import React from "react";

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
          // Skip if no transactions or editor is in the process of being destroyed
          if (!transactions.some((tr) => tr.docChanged)) return null;

          try {
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
          } catch (err) {
            console.warn("Error in FontHandlerExtension:", err);
            return null;
          }
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
  // Track if the component is mounted
  const isMounted = { current: true };

  const editor = useEditor({
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
    editorProps: {
      attributes: {
        class: "focus:outline-none",
      },
      handleDOMEvents: {
        // Add this to safely handle focus events
        focus: (view, event) => {
          if (!isMounted.current) {
            // Prevent focus if component is unmounting
            event.preventDefault();
            return true;
          }
          return false;
        },
      },
    },
    content,
    editable: isEditing,
    immediatelyRender: false,
    onCreate: ({ editor }) => {
      if (!isMounted.current) return;

      if (elementType === "text") {
        onUpdateContent(elementId, editor.getHTML());
      }
    },
    onUpdate: ({ editor }) => {
      if (!isMounted.current) return;

      if (elementType === "text") {
        onUpdateContent(elementId, editor.getHTML());
      }
    },
    onBlur: ({ editor }) => {
      if (!isMounted.current) return;

      if (onEditingEnd) {
        onEditingEnd();
      }
      onUpdateContent(elementId, editor.getHTML());
    },
  });

  // Set up unmount tracking
  React.useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;

      // Safely destroy the editor
      if (editor) {
        // Delay destruction slightly to let any pending operations complete
        setTimeout(() => {
          if (editor && !editor.isDestroyed) {
            editor.destroy();
          }
        }, 50);
      }
    };
  }, [editor]);

  return editor;
}

import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextStyle from "@tiptap/extension-text-style";
import { FontSize } from "@tiptap/extension-font-size";
import { Color } from "@tiptap/extension-color";
import { FontFamily } from "@tiptap/extension-font-family";
import TextAlign from "@tiptap/extension-text-align";

interface UseZineEditorProps {
  content: string;
  isEditing: boolean;
  elementId: string;
  elementType: string;
  onUpdateContent: (id: string, content: string) => void;
  onEditingEnd?: () => void;
}

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

import { useEffect, RefObject } from "react";

export function useFlipbook(ref: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const element = ref.current;
    const timer = setTimeout(() => {
      if (element && window.$) {
        const $flipbook = window.$(element);
        $flipbook.turn({
          width: 840,
          height: 600,
          autoCenter: true,
          display: "double",
          acceleration: true,
          elevation: 50,
          gradients: true,
        });

        // Show the flipbook after initialization
        $flipbook.css({
          visibility: "visible",
          opacity: 1,
        });
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (element && window.$) {
        try {
          const $flipbook = window.$(element);
          if ($flipbook.data()?.turn) {
            $flipbook.turn("destroy").remove();
          }
        } catch (error) {
          console.log("Cleanup error:", error);
        }
      }
    };
  }, [ref]);
}

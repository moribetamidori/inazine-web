import { useEffect, RefObject } from "react";

export function useFlipbook(ref: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const element = ref.current;

    const initializeFlipbook = () => {
      if (element && window.$) {
        const $flipbook = window.$(element);

        // Wait for all images to load before initializing
        const images = Array.from(element.getElementsByTagName("img"));
        Promise.all(
          images.map(
            (img) =>
              new Promise((resolve) => {
                if (img.complete) resolve(null);
                else img.onload = () => resolve(null);
              })
          )
        ).then(() => {
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
        });
      }
    };

    const timer = setTimeout(initializeFlipbook, 100);

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

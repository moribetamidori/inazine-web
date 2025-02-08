"use client";

import FirstPage from "../components/FirstPage";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const flipbookRef = useRef<HTMLDivElement>(null);
  const [flipbookHeight, setFlipbookHeight] = useState<number>(560);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/home");
    }
  }, [user, router]);

  useEffect(() => {
    const updateHeight = () => {
      if (flipbookRef.current) {
        const width = flipbookRef.current.offsetWidth;
        const height = width * 0.667; // 2/3 ratio
        setFlipbookHeight(Math.min(height, 560)); // Cap at 560px
      }
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  return (
    <div className="flex flex-col min-h-screen p-4 w-full">
      <header className="flex justify-between items-center mb-8 w-full">
        <Link href="/">
          <div className="flex items-center">
            <span className="text-2xl font-bold">⚡︎⚡︎⚡︎</span>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <span className="text-gray-700">{user.email}</span>
          ) : (
            <>
              <a href="/login">
                <button className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors duration-200">
                  Log in
                </button>
              </a>
              <a href="/login">
                <button className="ml-4 px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors duration-200">
                  Sign up
                </button>
              </a>
            </>
          )}
        </div>
      </header>

      <div className="flex flex-col lg:flex-row lg:justify-center lg:w-9/12 mx-auto">
        <div className="mb-8 lg:mb-0">
          <div className="p-4 w-full">
            <p className="text-2xl font-bold mb-4">InaZine is:</p>
            <p className="text-gray-500 mt-2">
              Click top or bottom corner of the zine to flip{" "}
              <span className="lg:hidden">↓</span>
              <span className="hidden lg:inline">→</span>
            </p>
          </div>
        </div>
        <div className="w-full flex justify-center">
          <div
            ref={flipbookRef}
            className="flipbook"
            style={{
              display: "block",
              width: "100%",
              maxWidth: "840px",
              height: `${flipbookHeight}px`,
              position: "relative",
            }}
          >
            <div className="hard flex flex-col">
              <p className="font-bold">Inazine</p>
              <small className="text-xs text-gray-500 text-center">
                That&apos;s a great idea! Why don&apos;t you put it in a zine?
              </small>
              💡
            </div>
            <div className="">
              <FirstPage />
            </div>
            <div className="text-center">
              <h2 className="font-bold">
                &quot;Finally, a place where my scraps feel sacred&quot;
              </h2>
              <small>✴Enter Inazine Universe✴</small>
            </div>
            <div className="image-page">
              <Image
                src="/images/p1.png"
                alt="Inazine"
                width={600}
                height={800}
                priority
              />
            </div>
            <div>
              <Image
                src="/images/p2.png"
                alt="Inazine"
                width={600}
                height={800}
                priority
              />
            </div>
            <div>
              <Image
                src="/images/p3.png"
                alt="Inazine"
                width={600}
                height={800}
                priority
              />
            </div>
            <div>
              <Image
                src="/images/p4.png"
                alt="Inazine"
                width={600}
                height={800}
                priority
              />
            </div>
            <div className="hard">Thank you for reading!</div>
          </div>
        </div>
      </div>

      {/* <PageContent /> */}
    </div>
  );
}

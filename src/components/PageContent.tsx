"use client";

import React from "react";

interface Page {
  title: string;
  content: React.ReactNode;
}

const PageContent: React.FC = () => {
  const pages: Page[] = [
    {
      title: "Inazine is for:",
      content: (
        <ol className="list-decimal list-inside mb-4 text-left">
          <li>Introverts with overflowing sketchbooks,</li>
          <li>Poets who collect subway ticket stubs,</li>
          <li>Artists building secret museums in their notes.</li>
        </ol>
      ),
    },
    {
      title: "Community",
      content: (
        <p className="mb-4">
          Students, hobbyists and what we call connected knowledge collectors
          have been the core of our community for 13 years and 179 days.
        </p>
      ),
    },
    {
      title: "Description",
      content: (
        <p className="mb-8">
          People describe Are.na as{" "}
          <strong>&quot;playlists, but for ideas&quot;</strong> or an{" "}
          <strong>&quot;Internet memory palace.&quot;</strong>
        </p>
      ),
    },
  ];

  return (
    <main className="flex flex-col items-center max-w-4xl mx-auto p-6">
      <div className="w-full space-y-12">
        {pages.map((page, index) => (
          <div key={index} className="bg-white">
            <h1 className="text-xl font-semibold mb-4">{page.title}</h1>
            {page.content}
          </div>
        ))}
      </div>
    </main>
  );
};

export default PageContent;

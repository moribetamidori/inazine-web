"use client";

import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useEffect, useState } from "react";
import UserMenu from "@/components/UserMenu";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default function HomePage() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (!user) {
      window.location.href = "/";
    }
  }, [user]);

  const handleCreateZine = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.id) {
        throw new Error("User not found");
      }
      const { data: zine, error } = await supabase
        .from("zines")
        .insert({
          title,
          description,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      router.push(`/${user?.id}/${zine.id}`);
    } catch (error) {
      console.error("Error creating zine:", error);
    }
  };

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <header className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center gap-4">
            <Link href="/home">
              <span className="text-2xl">⚡︎⚡︎⚡︎</span>
            </Link>
            <input
              type="text"
              placeholder="Search Are.na"
              className="px-4 py-2 bg-gray-100 rounded-md"
            />
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-1 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              New zine +
            </button>
            {/* <span>0</span> */}
            <UserMenu />
          </div>
        </header>

        <main className="p-8">
          <div className="mb-8">
            <h1 className="text-xl">
              Are.na / Feed ·{" "}
              <span className="text-gray-400">Explore · Profile</span>
            </h1>
          </div>

          <div className="text-center py-12">
            <h2 className="text-2xl text-gray-600 mb-4">Your feed is empty</h2>
            <p className="text-gray-500 mb-8">
              Discover how other people use Are.na, check and follow these
              community selected examples.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <FeedCard
                title="Featured Channels"
                author="by Are.na Team"
                blocks="929 blocks"
                time="6 days ago"
              />
              <FeedCard
                title="0 the fool"
                author="by sabrina miranda"
                blocks="117 blocks"
                time="5 days ago"
              />
              <FeedCard
                title=". Infinite Play"
                author="by rhizome"
                blocks="73 blocks"
                time="about 3 years ago"
              />
              <FeedCard
                title="David Lynch (1946–2025)"
                author="by Institute"
                blocks="114 blocks"
                time="2 days ago"
              />
            </div>
          </div>

          {isModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">New channel</h2>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Type channel name"
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe your channel here"
                      className="w-full px-3 py-2 border rounded-md"
                      rows={4}
                    />
                  </div>

                  <button
                    onClick={handleCreateZine}
                    className="w-full px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
                  >
                    Create channel
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

interface FeedCardProps {
  title: string;
  author: string;
  blocks: string;
  time: string;
}

function FeedCard({ title, author, blocks, time }: FeedCardProps) {
  return (
    <div className="border rounded-lg p-4 hover:border-gray-400 transition-colors">
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{author}</p>
      <p className="text-sm text-gray-500">{blocks}</p>
      <p className="text-sm text-gray-500">{time}</p>
    </div>
  );
}

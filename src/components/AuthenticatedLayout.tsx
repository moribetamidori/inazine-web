import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import UserMenu from "./UserMenu";
import NavLinks from "./NavLinks";
import { createZine } from "@/lib/zine";

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
  onNewZine?: () => void;
  zineTitle?: string;
}

export default function AuthenticatedLayout({
  children,
  zineTitle,
}: AuthenticatedLayoutProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) return null;

  const handleCreateZine = async () => {
    try {
      if (!user?.id) {
        throw new Error("User not found");
      }

      const zine = await createZine(title, description, user.id);
      setIsModalOpen(false);
      setTitle("");
      setDescription("");
      router.push(`/${user.id}/${zine.id}`);
    } catch (error) {
      console.error("Error creating zine:", error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex justify-between items-center p-4 border-b">
        <div className="flex items-center gap-4">
          <Link href="/home">
            <span className="text-2xl">⚡︎⚡︎⚡︎</span>
          </Link>
          <input
            type="text"
            placeholder="Search Inazine"
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
          <UserMenu />
        </div>
      </header>

      <main className="p-8">
        <NavLinks zineTitle={zineTitle} />
        {children}
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">New zine</h2>
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
                  placeholder="Type zine title"
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
                Create Zine
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

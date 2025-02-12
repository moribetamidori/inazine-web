import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import UserMenu from "./UserMenu";
import NavLinks from "./NavLinks";

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
  onNewZine?: () => void;
}

export default function AuthenticatedLayout({
  children,
  onNewZine,
}: AuthenticatedLayoutProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) return null;

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
            onClick={onNewZine}
            className="px-4 py-1 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            New zine +
          </button>
          <UserMenu />
        </div>
      </header>

      <main className="p-8">
        <NavLinks />
        {children}
      </main>
    </div>
  );
}

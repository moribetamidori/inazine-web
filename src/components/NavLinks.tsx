import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { deleteZine } from "@/lib/zine";

interface NavLinksProps {
  zineTitle?: string;
  zineId?: string;
}

export default function NavLinks({ zineTitle, zineId }: NavLinksProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const isProfile = user && pathname?.includes(`/${user.id}/profile`);
  const isExplore = pathname?.includes("/explore");
  const isFeed = pathname === "/home";
  const isEdit = user && zineId && pathname?.includes(`/${user.id}/${zineId}`);

  const handleDelete = async () => {
    if (user && zineId) {
      await deleteZine(zineId);
      router.push(`/${user.id}/profile`);
    }
  };

  return (
    <div className="mb-8">
      {zineTitle && zineId ? (
        <div className="flex items-center gap-2 mb-6">
          <h1 className="text-xl font-medium">{zineTitle}</h1>
          <span className="text-gray-500">|</span>
          {isEdit ? (
            <span className="text-blue-500">Editing</span>
          ) : (
            <Link href={`/${user?.id}/${zineId}`}>
              <span className="text-blue-500 hover:underline">Edit</span>
            </Link>
          )}
          <button onClick={handleDelete}>Delete</button>
        </div>
      ) : (
        <nav className="flex gap-6 mb-6">
          <Link href="/home">
            <span
              className={`${
                isFeed ? "font-semibold" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Feed
            </span>
          </Link>
          <Link href="/explore">
            <span
              className={`${
                isExplore
                  ? "font-semibold"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Explore
            </span>
          </Link>
          {user && (
            <Link href={`/${user.id}/profile`}>
              <span
                className={`${
                  isProfile
                    ? "font-semibold"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                Profile
              </span>
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}

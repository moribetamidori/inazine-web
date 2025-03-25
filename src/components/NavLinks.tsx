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
    <div className="mb-8 text-3xl">
      {zineTitle && zineId ? (
        isExplore ? (
          <div className="flex items-center gap-2 mb-6">
            <Link href="/explore">
              <span className="text-gray-500 hover:text-gray-800">Explore</span>
            </Link>
            <span className="text-gray-500">/</span>
            <h1 className="text-3xl font-medium">{zineTitle}</h1>
          </div>
        ) : (
          <div className="flex items-center gap-2 mb-6">
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
            <span className="text-gray-500">/</span>
            <h1 className="text-3xl font-medium">{zineTitle}</h1>
            <span className="text-gray-500">/</span>
            {isEdit ? (
              <span className="text-blue-500 text-xl">Editing</span>
            ) : (
              <Link href={`/${user?.id}/${zineId}`}>
                <span className="text-blue-500 hover:underline">Edit</span>
              </Link>
            )}
            <button onClick={handleDelete} className="text-red-500 text-xl">
              Delete
            </button>
          </div>
        )
      ) : (
        <nav className="flex gap-3 mb-6">
          <Link href="/home">
            <span
              className={`${
                isFeed ? "font-semibold" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Feed
            </span>
          </Link>
          <span className="text-gray-500">/</span>
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
          <span className="text-gray-500">/</span>
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

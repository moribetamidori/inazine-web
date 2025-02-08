import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function NavLinks() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  const isProfile = pathname.includes(`/${user.id}/profile`);
  const isExplore = pathname.includes("/explore");
  const isFeed = pathname === "/home";

  return (
    <div className="mb-8">
      <h1 className="text-xl">
        <Link href="/home" className={isFeed ? "font-bold" : ""}>
          Inazine / Feed
        </Link>{" "}
        ·{" "}
        <Link href="/explore" className={isExplore ? "font-bold" : ""}>
          Explore
        </Link>{" "}
        ·{" "}
        <Link
          href={`/${user.id}/profile`}
          className={isProfile ? "font-bold" : ""}
        >
          Profile
        </Link>
      </h1>
    </div>
  );
}

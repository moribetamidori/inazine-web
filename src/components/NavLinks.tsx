import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function NavLinks({
  zineTitle,
  zineId,
}: {
  zineTitle?: string;
  zineId?: string;
}) {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  const isProfile = pathname.includes(`/${user.id}/profile`);
  const isExplore = pathname.includes("/explore");
  const isFeed = pathname === "/home";
  const isEdit = pathname.includes(`/${user.id}/${zineId}`);

  return (
    <div className="mb-2">
      <h1 className="text-xl">
        <Link href="/home" className={isFeed ? "font-bold" : ""}>
          Inazine / Feed
        </Link>{" "}
        ·{" "}
        <Link
          href="/explore"
          className={!zineTitle && isExplore ? "font-bold" : ""}
        >
          Explore
        </Link>
        {!zineTitle && (
          <>
            {" "}
            ·{" "}
            <Link
              href={`/${user.id}/profile`}
              className={isProfile ? "font-bold" : ""}
            >
              Profile
            </Link>
          </>
        )}
        {zineTitle && isExplore && (
          <>
            <span className="font-bold"> / </span>
            <span className="font-bold">{zineTitle}</span>
          </>
        )}
        {zineTitle && isEdit && (
          <>
            {" "}
            ·{" "}
            <Link
              href={`/${user.id}/profile`}
              className={isProfile ? "font-bold" : ""}
            >
              Profile
            </Link>
            <span className="font-bold"> / </span>
            <span className="font-bold">{zineTitle}</span>
          </>
        )}
      </h1>
    </div>
  );
}

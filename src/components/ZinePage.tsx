import Image from "next/image";

interface ZinePageProps {
  pageUrl: string;
  index: number;
}

export default function ZinePage({ pageUrl, index }: ZinePageProps) {
  return (
    <div
      className="page"
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        backgroundColor: "white",
      }}
    >
      <Image
        src={pageUrl}
        alt={`Page ${index + 1}`}
        fill
        sizes="100%"
        style={{
          objectFit: "contain",
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
        priority={index === 0}
        onError={(e) => {
          console.error(`Failed to load image at index ${index}:`, pageUrl);
          (e.target as HTMLImageElement).src = "/placeholder-image.jpg";
        }}
      />
    </div>
  );
}

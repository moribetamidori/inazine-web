import Image from "next/image";

interface ZinePageProps {
  pageUrl: string;
  index: number;
}

export default function ZinePage({ pageUrl, index }: ZinePageProps) {
  return (
    <div className="page relative overflow-hidden">
      <Image
        src={pageUrl}
        alt={`Page ${index + 1}`}
        width={840}
        height={600}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          position: "absolute",
          top: 0,
          left: 0,
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

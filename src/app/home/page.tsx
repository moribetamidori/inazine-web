"use client";

import AuthenticatedLayout from "@/components/AuthenticatedLayout";

export default function HomePage() {
  return (
    <AuthenticatedLayout>
      <div className="text-center py-12">
        <h2 className="text-2xl text-gray-600 mb-4">Your feed is empty</h2>
        <p className="text-gray-500 mb-8">
          Discover how other people use Inazine, check and follow these
          community selected examples.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <FeedCard
            title="Featured Channels"
            author="by Inazine Team"
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
    </AuthenticatedLayout>
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

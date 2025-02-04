import PageContent from '../components/PageContent';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen p-4">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <span className="text-2xl font-bold">⚡︎⚡︎⚡︎</span>
        </div>
        <div>
          <button className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors duration-200">
            Log in
          </button>
          <button className="ml-4 px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors duration-200">
            Sign up
          </button>
        </div>
      </header>
      <PageContent />
    </div>
  );
}

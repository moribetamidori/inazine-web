import Script from "next/script";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen p-4">
      <Script src="/scripts/jquery.js" strategy="beforeInteractive" />
      <Script src="/scripts/turn.js" strategy="beforeInteractive" />
      <Script id="turn-init">
        {`
          $(document).ready(function() {
            $(".flipbook").turn();
          });
        `}
      </Script>
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
      <div
        className="flipbook"
        style={{ display: "block", minHeight: "600px", width: "800px" }}
      >
        <div className="hard">Inazine</div>
        <div className="hard">Welcome</div>
        <div>
          <h2 className="text-xl font-bold mb-4">Inazine is for:</h2>
          <ol className="list-decimal list-inside mb-4 text-left">
            <li>Introverts with overflowing sketchbooks,</li>
            <li>Poets who collect subway ticket stubs,</li>
            <li>Artists building secret museums in their notes.</li>
          </ol>
        </div>
        <div>
          <h2 className="text-xl font-bold mb-4">Community</h2>
          <p className="mb-4">blahblahblah</p>
        </div>
        <div>
          <h2 className="text-xl font-bold mb-4">Description</h2>
          <p className="mb-8">People describe Inazine as </p>
        </div>
        <div className="hard"></div>
        <div className="hard">Thank you for reading!</div>
      </div>

      {/* <PageContent /> */}
    </div>
  );
}

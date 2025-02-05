import Script from "next/script";
import FirstPage from "../components/FirstPage";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen p-4 w-full">
      <Script src="/scripts/jquery.js" strategy="beforeInteractive" />
      <Script src="/scripts/turn.js" strategy="beforeInteractive" />
      <Script id="turn-init">
        {`
          $(document).ready(function() {
            $(".flipbook").turn();
          });
        `}
      </Script>
      <header className="flex justify-between items-center mb-8 w-full">
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
      <div className="flex justify-center w-9/12 mx-auto">
        <div>
          <div className="p-4 w-full">
            <p className="text-2xl font-bold mb-4">InaZine is:</p>

            <p className="text-gray-500 mt-2">
              Click top or bottom corner of the zine on the right to flip →
            </p>
          </div>
        </div>
        <div>
          <div
            className="flipbook"
            style={{
              display: "block",
              width: "840px",
              height: "560px",
              maxWidth: "100%",
              position: "relative",
            }}
          >
            <div className="hard flex flex-col">
              <p className="font-bold">Inazine</p>
              <small className="text-xs text-gray-500">
                That&apos;s a great idea! Why don&apos;t you put it in a zine?
              </small>
              💡
            </div>
            <div className="">
              <FirstPage />
            </div>
            <div>
              <h2 className="font-bold">
                &quot;Finally, a place where my scraps feel sacred&quot;
              </h2>
              <small>✴Enter Inazine Universe✴</small>
            </div>
            <div className="image-page">
              <Image
                src="/images/p1.png"
                alt="Inazine"
                width={600}
                height={800}
                priority
              />
            </div>
            <div>
              <Image
                src="/images/p2.png"
                alt="Inazine"
                width={600}
                height={800}
                priority
              />
            </div>
            <div>
              <Image
                src="/images/p3.png"
                alt="Inazine"
                width={600}
                height={800}
                priority
              />
            </div>
            <div>
              <Image
                src="/images/p4.png"
                alt="Inazine"
                width={600}
                height={800}
                priority
              />
            </div>
            <div className="hard">Thank you for reading!</div>
          </div>
        </div>
      </div>

      {/* <PageContent /> */}
    </div>
  );
}

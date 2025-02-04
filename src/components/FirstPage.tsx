export default function FirstPage() {
  return (
    <div className="">
      <div className="absolute top-2 left-2 ">
        <p className="font-bold">The origin of Inazine</p>
        <p className="font-normal">
          Inspired by the spark, lightning, and thunder talks that took place in
          my community at{" "}
          <a
            className="underline"
            href="https://www.mars.college"
            target="_blank"
            rel="noopener noreferrer"
          >
            Mars College
          </a>
          , I combined the word &quot;inazuma&quot; (稲妻), which means
          &quot;lightning&quot; in Japanese, with &quot;zine&quot; to create
          &quot;Inazine.&quot; At first, I thought this might be a bit wordy to
          say. But my partner said he actually likes it because you can tell
          people, &quot;That&apos;s a great idea, why don&apos;t you put that in
          a zine (Inazine)?&quot; I found this layer of pun to be quite funny
          and decided to stick with it.
        </p>
        <div className="mt-8">
          <h2 className="font-bold">Inazine is for</h2>
          <p className=" transition-all duration-300 hover:translate-x-2 hover:text-emerald-600 cursor-default ">
            ✏️ Introverts with overflowing sketchbooks 🎨
          </p>
          <p className=" transition-all duration-300 hover:translate-x-2 hover:text-indigo-600 cursor-default ">
            📝 Poets who collect subway ticket stubs 🎫
          </p>
          <p className=" transition-all duration-300 hover:translate-x-2 hover:text-fuchsia-600 cursor-default ">
            🖼️ Artists building secret museums in their notes ✨
          </p>
          <p className=" transition-all duration-300 hover:translate-x-2 hover:text-fuchsia-600 cursor-default ">
            ... you name it
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <main className="min-h-screen min-w-full bg-zinc-900 text-white">
      <form>
        <ul id="consoleElement">
          <li>
            <h3>Last login: Fri Oct 13 18:22:24 on consoleElement</h3>
          </li>
          <li>
            <h3>
              0.0.0.0@HackBook-L ~ % {" "}
              <input
                className="bg-transparent outline-none"
                type="text"
                name="command-prompt"
                id="command-prompt"
              />
            </h3>
          </li>
        </ul>
      </form>
    </main>
  );
}

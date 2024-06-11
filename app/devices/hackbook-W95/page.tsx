import Desktop from "../../ui/hackbook-W95/desktop";
import { DefaultValues, Errors, Models } from "@/app/lib/constants";
import { haveModel } from "@/app/lib/actions";

export default async function Page() {
  const response = await haveModel(Models.W95);

  switch (response) {
    case Errors.INVALID_LOGIN:
      return <h1>Invalid Login</h1>; // TODO: Need Improvement
    case Errors.DEVICE_NOT_FOUND:
      return <h1>Model not found</h1>; // TODO: Need Improvement
  }

  return (
    <main id="screen" className=" h-screen w-screen fixed">
      <div className="w-full absolute flex justify-center pointer-events-none z-20 h-full">
        {APPS.map((app) => (
          <Draggable disabled={app.fullscreen} key={app.name}>
            <div
              id="screen"
              key={app.name}
              className={clsx(
                "bg-[#BBC2C2] pointer-events-auto overscroll-none m-auto shadow shadow-black rounded-sm border-2 border-black border-t-white border-l-white ",
                {
                  "w-[100%] h-[100%] !translate-x-0 !translate-y-0": app.fullscreen,
                  "w-[80%] h-[80%]": !app.fullscreen,
                  hidden: runningApp !== app,
                }
              )}
            >
              <div className="h-[5%] w-auto bg-blue-800 m-[0.5%] flex ">
                <img src={app.icon} alt="" />
                <h1 className="text-white text-left w-full m-auto font-bold text-xl">{app.name}</h1>
                <div className="flex justify-around text-center w-[10%]">
                  <div
                    className=" h-[85%] w-[33%] m-0.5 cursor-pointer flex justify-center hover:border-b-white  hover:border-r-white hover:border-l-black hover:border-t-black bg-[#BBC2C2] border-2 shadow shadow-black border-black border-t-white border-l-white"
                    onClick={() => {
                      setRunningApp(null);
                    }}
                  >
                    <div className=" font-extrabold border-b-2 border-b-black w-3 h-5 m-auto "></div>
                  </div>
                  <div
                    className=" h-[85%] w-[33%] m-0.5 cursor-pointer flex justify-center hover:border-b-white  hover:border-r-white hover:border-l-black hover:border-t-black bg-[#BBC2C2] border-2 shadow shadow-black border-black border-t-white border-l-white"
                    onClick={() => {
                      app.fullscreen = !app.fullscreen;
                    }}
                  >
                    <div className=" font-extrabold w-5 h-5  m-auto ">
                      {app.fullscreen ? (
                        <div className="px-1">
                          <div className="w-3 h-3 border border-black border-t-4 translate-x-0.5 "></div>
                          <div className="w-3 h-3 border border-black border-t-4  -translate-y-1 -translate-x-0.5"></div>
                        </div>
                      ) : (
                        <div className="w-5 h-5 border border-black border-t-4"></div>
                      )}
                    </div>
                  </div>
                  <div
                    className=" h-[85%] w-[33%] m-0.5 cursor-pointer flex justify-center   hover:border-b-white  hover:border-r-white hover:border-l-black hover:border-t-black bg-[#BBC2C2] border-2 shadow shadow-black border-black border-t-white border-l-white"
                    onClick={close}
                  >
                    <h1
                      className={clsx("text-2xl font-bold  ", {
                        "-mt-1 ": !app.fullscreen,
                      })}
                    >
                      &#10005;
                    </h1>
                  </div>
                </div>
              </div>

              <div className="h-full w-full">
                <div className="flex h-[5%] justify-start w-full  bg-[#BBC2C2] text-start">
                  <h1 className="my-auto mx-2 underline">File</h1>
                  <h1 className="my-auto mx-2 underline">Edit</h1>
                  <h1 className="my-auto mx-2 underline">View</h1>
                  <h1 className="my-auto mx-2 underline">Help</h1>
                </div>

                {app.name === "Internet Explorer" && (
                  <>
                    <div className="border w-full h-0.5 bg-[#BBC2C2] border-b-white border-t-black"></div>

                    <div className="flex h-[5%] justify-start w-full  bg-[#BBC2C2] text-start">
                      <h1 className="my-auto mx-2">Address: </h1>
                      <input
                        id="searchBar"
                        type="text"
                        defaultValue={DEFAULT_LINK}
                        className="bg-white h-7 w-full m-auto mx-10 border-2 shadow shadow-black border-black border-b-white border-r-white"
                        onClick={(e) => {
                          const input = e.target as HTMLInputElement;
                          input.select();
                        }}
                        onKeyDown={(e) => {
                          const input = e.target as HTMLInputElement;
                          if (e.key === "Enter") {
                            const url = input.value;
                            setLink(url);
                          }
                        }}
                      />
                    </div>
                  </>
                )}

                <div className="border w-full h-1 bg-transparent border-t-white border-b-black"></div>

                <div
                  className={clsx(" w-[99.8%] fixed overflow-auto bg-zinc-900", {
                    "h-[82.2%]": app.name === "Internet Explorer",
                    "h-[87.2%]": app.name !== "Internet Explorer",
                  })}
                >
                  {getComponent()}
                </div>
              </div>
            </div>
          </Draggable>
        ))}
      </div>

      <div className="w-full h-[96%] absolute z-0" onClick={deSelect}></div>

      <div
        id="desktop"
        className="bg-[#008080] grid grid-cols-10 grid-rows-6 grid-flow-col w-full h-[96%] z-0 text-black"
      >
        {APPS.map((app) => (
          <div
            key={app.name}
            className="col-span-1 row-span-1 flex justify-center z-10"
            onClick={() => {
              handleItemClick(app);
            }}
          >
            <div className="m-auto text-center break-words">
              <img
                className={clsx("h-24 w-24", {
                  "saturate-200": app === selectedApp,
                })}
                src={app.icon}
              />
              <h4
                className={clsx("w-20 text-sm", {
                  "text-white bg-blue-700": app === selectedApp,
                })}
              >
                {app.name}
              </h4>
            </div>
          </div>
        ))}
      </div>

      <div
        id="menu"
        className={clsx(
          "absolute h-[70vh] w-[25vw] bg-[#BBC2C2] shadow shadow-black rounded-sm border-2 border-black border-b-white border-r-white flex flex-col justify-between bottom-[4%] origin-top z-30",
          {
            hidden: !openMenu,
          }
        )}
      >
        {/* Menu items */}
        {APPS.map((app) => (
          <div
            key={app.name}
            className=" hover:bg-blue-900 hover:text-white flex text-left"
            onClick={() => {
              handleItemClick(app, "single");
            }}
          >
            <img className="h-20" src={app.icon} alt="" />
            <h1 className="m-auto w-full">{app.name}</h1>
          </div>
        ))}

        {/* Divider */}
        <div className="border-2 w-full h-1 bg-transparent border-t-white border-b-black opacity-25 "></div>

        {/* Custom menu items */}
        <form action={logout} className=" hover:bg-blue-900 hover:text-white ">
          <button type="submit" className="flex text-left">
            <img className="h-16 mx-3" src="/hackbook-W95/app-icon/log-out.png" alt="" />
            <h3 className="m-auto w-full">Log Out</h3>
          </button>
        </form>

        <div
          className=" hover:bg-blue-900 hover:text-white flex text-left"
          onClick={() => {
            router.push("/dashboard");
          }}
        >
          <img className="h-16 mx-3" src="/hackbook-W95/app-icon/shut-down.png" alt="" />
          <h1 className="m-auto w-full">Shut Down</h1>
        </div>
      </div>

      <div id="dock" className="w-full bg-[#BBC2C2] h-[4%] flex justify-between">
        <button
          type="button"
          aria-expanded="false"
          id="menu-button"
          className={clsx(
            "text-center my-auto w-[6%] shadow shadow-black font-semibold border-2 border-black rounded-sm p-1 px-4 m-1 text-sm",
            {
              "border-b-white border-r-white": openMenu,
              "border-t-white border-l-white": !openMenu,
            }
          )}
          onClick={() => {
            setOpenMenu(!openMenu);
          }}
        >
          Start
        </button>
        <div id="panel" className="w-[88%] h-full flex justify-start">
          {runningApps.map((app) => (
            <div
              className={clsx("w-full max-w-sm h-full border-2 shadow shadow-black border-black flex", {
                "bg-[#dfe6e6] border-b-white border-r-white": runningApp === app,
                "bg-[#BBC2C2] border-t-white border-l-white": runningApp !== app,
              })}
              onClick={() => {
                handleItemClick(app, "single");
              }}
            >
              <img className="h-10 w-10 -m-1.5" src={app.icon} alt="" />
              <h1 className="text-black text-left w-full m-auto font-bold text-xl">{app.name}</h1>
            </div>
          ))}
        </div>
        <h1 className="text-center w-[6%] my-auto px-3 mx-1 border-2 shadow shadow-black border-black border-b-white border-r-white">
          {date.toLocaleTimeString().slice(0, -6) + date.toLocaleTimeString().split(" ")[1]}
        </h1>
      </div>
    </main>
  );
};

export default Page;

"use client";

import React, { useEffect, useState } from "react";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { Rnd } from "react-rnd";

import Inbox from "@/app/ui/hackbook-W95/apps/Inbox";
import InternetExplorer from "@/app/ui/hackbook-W95/apps/InternetExplorer";
import RecycleBin from "@/app/ui/hackbook-W95/apps/RecycleBin";
import MyComputer from "@/app/ui/hackbook-W95/apps/MyComputer";
import Console from "@/app/ui/hackbook-L/console";

import { logout } from "@/app/lib/actions";
import { DefaultValues, Models } from "@/app/lib/constants";
import { App } from "@/app/lib/definitions";

const APPS: App[] = [
  new App("Internet Explorer", "/hackbook-W95/app-icon/ie.png"),
  new App("My Computer", "/hackbook-W95/app-icon/mycomputer.png"),
  new App("Terminal", "/hackbook-W95/app-icon/terminal.png"),
  new App("Recycle Bin", "/hackbook-W95/app-icon/recyclebin.png"),
  new App("Inbox", "/hackbook-W95/app-icon/inbox.png"),
];

const Desktop = () => {
  const router = useRouter();

  const [openMenu, setOpenMenu] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null as App | null);
  const [runningApp, setRunningApp] = useState(null as App | null);
  const [runningApps, setRunningApps] = useState([] as App[]);
  const [date, setDate] = useState(Date.now());
  const [link, setLink] = useState(DefaultValues.LINK as string);

  function deSelect() {
    setSelectedApp(null);
    setOpenMenu(false);
  }

  function handleItemClick(app: App, clickTypeRequires: "single" | "double" = "double") {
    const clickType = selectedApp === app ? "double" : "single";

    if (clickTypeRequires === clickType) {
      open(app);
    } else {
      setSelectedApp(app);
    }
  }

  function close() {
    if (!runningApp) {
      return;
    }

    runningApp.fullscreen = false;
    setRunningApps(runningApps.filter((app) => app !== runningApp));
    setRunningApp(null);
  }

  function open(app: App) {
    if (runningApp === app) {
      return;
    }

    if (!runningApps.filter((runningApp) => runningApp.name === app.name).length) {
      setRunningApps([...runningApps, app]);
    }

    setRunningApp(app);
    deSelect();
  }

  function openLink(link: string) {
    const app = APPS.find((app) => app.name === "Internet Explorer");
    if (app) {
      open(app);
    }

    const searchBar = document.getElementById("searchBar") as HTMLInputElement;

    if (searchBar) {
      searchBar.value = link;
    }

    setLink(link);
  }

  function getComponent(name: string) {
    if (!runningApp) {
      return null;
    }

    switch (name) {
      case "Internet Explorer":
        return <InternetExplorer link={link} />;
      case "My Computer":
        return <MyComputer />;
      case "Terminal":
        return <Console model={Models.W95} />;
      case "Recycle Bin":
        return <RecycleBin />;
      case "Inbox":
        return <Inbox openLink={openLink} />;
      default:
        return null;
    }
  }

  useEffect(() => {
    // if (!localStorage.getItem("userId")) {
    //   router.push("/hackbook-W95/login");
    // }

    window.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && selectedApp) {
        open(selectedApp);
      }
    });

    const interval = setInterval(() => {
      setDate(new Date().getTime());
    }, 1000);

    return () => {
      window.removeEventListener("keydown", (e) => {
        if (e.key === "Enter" && selectedApp) {
          open(selectedApp);
        }
      });

      clearInterval(interval);
    };
  }, []);

  return (
    <main id="screen" className="h-screen w-screen overscroll-none fixed">
      {APPS.map((app) => (
        <div
          key={app.name}
          className={clsx("", {
            hidden: runningApp !== app,
          })}
        >
          <Rnd
            default={{
              x: 80,
              y: 40,
              width: "80vw",
              height: "80vh",
            }}
            minWidth={app.fullscreen ? "100vw" : "60vw"}
            minHeight={app.fullscreen ? "100vh" : "60vh"}
            className={clsx("z-30", {
              "!translate-x-0 !translate-y-0 ": app.fullscreen,
            })}
            enableResizing={!app.fullscreen}
            disableDragging={app.fullscreen}
            bounds="window"
          >
            <div className="bg-[#BBC2C2] overscroll-none m-auto h-full w-full shadow shadow-black rounded-sm border-2 border-black border-t-white border-l-white">
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
                        defaultValue={DefaultValues.LINK}
                        className="bg-white h-7 w-full m-auto mx-10 border-2 shadow shadow-black border-black border-b-white border-r-white"
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
                  className={clsx("w-[99.8%] fixed bg-zinc-900", {
                    "h-[82.2%]": app.name === "Internet Explorer",
                    "h-[87.2%]": app.name !== "Internet Explorer",
                  })}
                >
                  {getComponent(app.name)}
                </div>
              </div>
            </div>
          </Rnd>
        </div>
      ))}

      {/* <div className="w-full h-[96%] absolute z-0" onClick={deSelect}></div> */}

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
          <button
            type="submit"
            onClick={() => {
              localStorage.clear();
            }}
            className="flex text-left"
          >
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
              key={app.name}
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
          {new Date(date).toTimeString().slice(0, 5)}
        </h1>
      </div>
    </main>
  );
};

export default Desktop;

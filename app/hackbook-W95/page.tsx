"use client";

import Inbox from "@/components/Inbox";
import InternetExplorer from "@/components/InternetExplorer";
import RecycleBin from "@/components/RecycleBin";
import MyComputer from "@/components/MyComputer";

import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Draggable from "react-draggable";

type DraggableData = {
  node: HTMLElement;
  // lastX + deltaX === x
  x: number;
  y: number;
  deltaX: number;
  deltaY: number;
  lastX: number;
  lastY: number;
};

class App {
  name: string;
  icon: string;
  path?: string;
  clicked: boolean;
  opened: boolean;
  fullscreen: boolean;
  hidden: boolean;
  defaultPosition: { x: number; y: number } = { x: 0, y: 0 };

  constructor(name: string, icon: string, path?: string) {
    this.name = name;
    this.icon = icon;
    this.path = path;
    this.clicked = false;
    this.opened = false;
    this.fullscreen = false;
    this.hidden = false;
  }
}

const APPS: App[] = [
  new App("Internet Explorer", "/ie.png", "/hackbook-W95/ie"),
  new App("My Computer", "/mycomputer.png", "/hackbook-W95/mycomputer"),
  new App("Terminal", "/terminal.png", "/"),
  new App("Recycle Bin", "/recyclebin.png", "/hackbook-W95/recyclebin"),
  new App("Inbox", "/inbox.png", "/hackbook-W95/inbox"),
];
const Page = () => {
  const router = useRouter();

  const [apps, setApps] = useState(APPS);
  const [clickedStart, setClickedStart] = useState(false);
  const [selectedAppIndex, setSelectedAppIndex] = useState(0);
  const [date, setDate] = useState(new Date());

  const [link, setLink] = useState("https://en.wikipedia.org/wiki/Main_Page");

  function handleOpenLink() {
    const app = apps[0];

    if (app.hidden) {
      app.hidden = false;
      app.opened = true;
      setApps([...apps]);
      setSelectedAppIndex(0);

      hideOtherOpenApps();

      const previewElement = document.getElementById(app.name);
      if (previewElement) {
        ["bg-[#dfe6e6]", "border-b-white", "border-r-white"].forEach((className) => {
          previewElement.classList.add(className);
        });
        ["bg-[#BBC2C2]", "border-t-white", "border-l-white"].forEach((className) => {
          previewElement.classList.remove(className);
        });
      }

      return;
    }

    app.clicked = false;
    app.opened = true;
    setApps([...apps]);
    setSelectedAppIndex(0);

    hideOtherOpenApps();

    addElement(app, 0);
  }

  function openApp() {
    switch (apps[selectedAppIndex].name) {
      case "Internet Explorer":
        return  <InternetExplorer fullscreen={apps[selectedAppIndex].fullscreen} link={link} setLink={setLink} />;
      case "Inbox":
        return (
          <Inbox fullscreen={apps[selectedAppIndex].fullscreen} setLink={setLink} handleOpenLink={handleOpenLink} />
        );
      case "Recycle Bin":
        return <RecycleBin fullscreen={apps[selectedAppIndex].fullscreen} />;
      case "My Computer":
        return <MyComputer fullscreen={apps[selectedAppIndex].fullscreen} />;
      default:
        return (
          <iframe
            src={apps[selectedAppIndex].path}
            className={` ${
              apps[selectedAppIndex].fullscreen ? "w-[98vw] h-[90vh]" : "w-[78vw] h-[70vh]"
            } m-auto overscroll-none`}
          />
        );
    }
  }

  function deSelectAll() {
    apps.forEach((app) => {
      app.clicked = false;
    });
    setApps([...apps]);
    setClickedStart(false);
  }

  function addElement(
    app: {
      name: any;
      icon: any;
      path?: string;
      clicked?: boolean;
      opened?: boolean;
      fullscreen?: boolean;
      hidden?: boolean;
    },
    index: number
  ) {
    const panelElement = document.getElementById("panel");
    const previewElement = document.createElement("div");

    previewElement.id = app.name;

    previewElement.className =
      "w-full max-w-sm h-full bg-[#dfe6e6] border-2 shadow shadow-black border-black border-b-white border-r-white flex";

    previewElement.innerHTML = `<img class="h-10 w-10 -m-1.5" src="${app.icon}" alt="" />
                  <h1 class="text-black text-left w-full m-auto font-bold text-xl">${app.name}</h1>`;

    previewElement.addEventListener("click", () => {
      if (app.hidden) {
        app.hidden = false;
        app.opened = true;
        setApps([...apps]);
        setSelectedAppIndex(index);

        hideOtherOpenApps();

        const previewElement = document.getElementById(app.name);
        if (previewElement) {
          ["bg-[#dfe6e6]", "border-b-white", "border-r-white"].forEach((className) => {
            previewElement.classList.add(className);
          });
          ["bg-[#BBC2C2]", "border-t-white", "border-l-white"].forEach((className) => {
            previewElement.classList.remove(className);
          });
        }

        return;
      }
    });

    if (panelElement) {
      panelElement.appendChild(previewElement);
    }
  }

  function removeElement(appName: string) {
    const panelElement = document.getElementById("panel");
    const previewElement = document.getElementById(appName);

    if (panelElement && previewElement) {
      panelElement.removeChild(previewElement);
    }
  }

  function hideOtherOpenApps() {
    apps.forEach((app, index) => {
      const previewElement = document.getElementById(app.name);
      if (previewElement) {
        ["bg-[#dfe6e6]", "border-b-white", "border-r-white"].forEach((className) => {
          previewElement.classList.remove(className);
        });
        ["bg-[#BBC2C2]", "border-t-white", "border-l-white"].forEach((className) => {
          previewElement.classList.add(className);
        });
        app.hidden = true;
        setApps([...apps]);
      }
    });
  }

  function savePosition(data: DraggableData) {
    apps[selectedAppIndex].defaultPosition = {
      x: data.x,
      y: data.y,
    };
    setApps([...apps]);
  }

  useEffect(() => {
    if (!localStorage.getItem("userId")) {
      router.push("/hackbook-W95/login");
    }

    window.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        apps.forEach((app, index) => {
          if (app.clicked) {
            app.clicked = false;
            app.opened = true;
            setApps([...apps]);
            setSelectedAppIndex(index);

            hideOtherOpenApps();

            addElement(app, index);
            return;
          }
        });
      }
    });

    setInterval(() => {
      setDate(new Date());
    }, 60000);
  }, []);

  return (
    <main className="bg-[#008080] h-screen w-screen ">
      <div
        className={` ${
          apps[selectedAppIndex].fullscreen ? "h-[100vh]" : "h-[96vh]"
        } w-screen absolute flex justify-center pointer-events-none  ${
          apps[selectedAppIndex].opened ? "" : "hidden"
        } z-20`}
      >
        <Draggable
          disabled={apps[selectedAppIndex].fullscreen}
          onDrag={(e, data) => {
            savePosition(data);
          }}
          position={apps[selectedAppIndex].defaultPosition}
        >
          <div
            id="screen"
            className={`bg-[#BBC2C2] ${
              apps[selectedAppIndex].fullscreen
                ? "w-[100vw] h-[100vh] !translate-x-0 !translate-y-0"
                : "w-[80vw] h-[80vh]"
            }    pointer-events-auto overscroll-none m-auto shadow shadow-black rounded-sm border-2 border-black border-t-white border-l-white`}
          >
            <div className="h-10 w-auto bg-blue-800 m-2 flex ">
              <img src={apps[selectedAppIndex].icon} alt="" />
              <h1 className="text-white text-left w-full m-auto font-bold text-xl">{apps[selectedAppIndex].name}</h1>
              <div className="flex justify-around">
                <h1
                  className="text-center text-2xl cursor-pointer font-extrabold  hover:border-b-white  hover:border-r-white hover:border-l-black hover:border-t-black bg-[#BBC2C2] my-1 px-2 mx-1 border-2 shadow shadow-black border-black border-t-white border-l-white"
                  onClick={() => {
                    hideOtherOpenApps();
                    apps[selectedAppIndex].opened = false;
                    setApps([...apps]);
                  }}
                >
                  _
                </h1>
                <h1
                  className="text-center cursor-pointer  hover:border-b-white  hover:border-r-white hover:border-l-black hover:border-t-black bg-[#BBC2C2] my-1 p-1 border-2 shadow shadow-black border-black border-t-white border-l-white"
                  onClick={() => {
                    apps[selectedAppIndex].fullscreen = !apps[selectedAppIndex].fullscreen;
                    setApps([...apps]);
                  }}
                >
                  {apps[selectedAppIndex].fullscreen ? (
                    <div className="px-1">
                      <div className="w-3 h-3 border border-black border-t-4 translate-x-0.5 "></div>
                      <div className="w-3 h-3 border border-black border-t-4  -translate-y-1 -translate-x-0.5"></div>
                    </div>
                  ) : (
                    <div className="w-5 h-5 border border-black border-t-4"></div>
                  )}
                </h1>
                <h1
                  className="text-center text-2xl font-bold cursor-pointer hover:border-b-white  hover:border-r-white hover:border-l-black hover:border-t-black bg-[#BBC2C2] my-1 px-1 mx-1 border-2 shadow shadow-black border-black border-t-white border-l-white"
                  onClick={() => {
                    removeElement(apps[selectedAppIndex].name);
                    apps[selectedAppIndex].opened = false;
                    apps[selectedAppIndex].fullscreen = false;
                    apps[selectedAppIndex].defaultPosition = { x: 0, y: 0 };
                    setApps([...apps]);
                  }}
                >
                  &#10005;
                </h1>
              </div>
            </div>
            {openApp()}
          </div>
        </Draggable>
      </div>
      <div className="h-[96vh] w-screen absolute z-0" onClick={deSelectAll}></div>
      <div className="grid grid-cols-10 grid-rows-6 grid-flow-col w-screen h-[96vh] text-black">
        {APPS.map((app, index) => (
          <div
            key={app.name}
            className="col-span-1 row-span-1 flex justify-center z-10"
            onClick={() => {
              if (app.hidden && app.clicked) {
                app.hidden = false;
                app.opened = true;
                setApps([...apps]);
                setSelectedAppIndex(index);

                hideOtherOpenApps();

                const previewElement = document.getElementById(app.name);
                if (previewElement) {
                  ["bg-[#dfe6e6]", "border-b-white", "border-r-white"].forEach((className) => {
                    previewElement.classList.add(className);
                  });
                  ["bg-[#BBC2C2]", "border-t-white", "border-l-white"].forEach((className) => {
                    previewElement.classList.remove(className);
                  });
                }

                return;
              }
              if (app.clicked && !app.opened) {
                app.clicked = false;
                app.opened = true;
                setApps([...apps]);
                setSelectedAppIndex(index);

                hideOtherOpenApps();

                addElement(app, index);
                return;
              }
              deSelectAll();
              apps[index].clicked = true;
              setApps([...apps]);
            }}
          >
            <div className="m-auto text-center break-words">
              <img className={`h-24 w-24 ${app.clicked ? "saturate-200" : ""} `} src={app.icon} />
              <h4 className={`w-20 text-sm ${app.clicked ? "text-white bg-blue-700" : ""}`}>{app.name}</h4>
            </div>
          </div>
        ))}
      </div>
      <div className="w-screen bg-[#BBC2C2] h-[4vh] flex justify-between">
        <div
          className={`absolute h-[70vh] w-[25vw] bg-[#BBC2C2] shadow shadow-black rounded-sm border-2 border-black border-b-white border-r-white grid grid-flow-row grid-cols-1 grid-rows-7 rotate-180 origin-top z-30 ${
            clickedStart ? "" : "hidden"
          }`}
        >
          <div
            className=" hover:bg-blue-900 hover:text-white rotate-180 flex text-left"
            onClick={() => {
              localStorage.removeItem("userId");

              // Sends user to login page
              router.push("/hackbook-W95/login");
            }}
          >
            <img className="h-16 mx-3" src="/log-out.png" alt="" />
            <h1 className="m-auto w-full">Log Out</h1>
          </div>
          <div
            className=" hover:bg-blue-900 hover:text-white rotate-180 flex text-left"
            onClick={() => {
              localStorage.removeItem("userId");

              // Sends user to hackbook-L
              router.replace("/");
            }}
          >
            <img className="h-20" src="/change-comp.png" alt="" />
            <h1 className="m-auto w-full">Change Computer</h1>
          </div>
          <div className="border-2 w-full h-1 bg-transparent border-t-white border-b-black opacity-25 "></div>
          {apps.map((app, index) => (
            <div
              key={app.name}
              className=" hover:bg-blue-900 hover:text-white rotate-180 flex text-left"
              onClick={() => {
                if (app.hidden) {
                  app.hidden = false;
                  app.opened = true;
                  setApps([...apps]);
                  setSelectedAppIndex(index);

                  hideOtherOpenApps();

                  const previewElement = document.getElementById(app.name);
                  if (previewElement) {
                    ["bg-[#dfe6e6]", "border-b-white", "border-r-white"].forEach((className) => {
                      previewElement.classList.add(className);
                    });
                    ["bg-[#BBC2C2]", "border-t-white", "border-l-white"].forEach((className) => {
                      previewElement.classList.remove(className);
                    });
                  }
                } else if (!app.opened) {
                  app.clicked = false;
                  app.opened = true;
                  setApps([...apps]);
                  setSelectedAppIndex(index);

                  hideOtherOpenApps();

                  addElement(app, index);
                }

                setClickedStart(false);
              }}
            >
              <img className="h-20" src={app.icon} alt="" />
              <h1 className="m-auto w-full">{app.name}</h1>
            </div>
          ))}
        </div>
        <h1
          className={`text-center my-auto shadow shadow-black ${
            clickedStart ? "border-b-white border-r-white" : "border-t-white border-l-white"
          } font-semibold border-2 border-black  rounded-sm p-1 px-4 m-1 text-sm`}
          onClick={() => {
            setClickedStart(!clickedStart);
          }}
        >
          Start
        </h1>
        <div id="panel" className="w-full h-full  flex justify-start"></div>
        <h1 className="text-center my-auto px-3 mx-1 border-2 shadow shadow-black border-black border-b-white border-r-white">
          {date.toLocaleTimeString().slice(0, -6) + date.toLocaleTimeString().split(" ")[1]}
        </h1>
      </div>
    </main>
  );
};

export default Page;

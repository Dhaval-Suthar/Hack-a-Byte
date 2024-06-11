"use client";

import clsx from "clsx";
import React, { useState } from "react";

const MyComputer = () => {
  const [selected, setSelected] = useState(null as string | null);

  return (
    <div className={`h-full w-full bg-white grid grid-cols-10 grid-rows-6 grid-flow-col`}>
      <div
        className="col-span-1 row-span-1 flex justify-center z-10"
        onClick={() => {
          if (selected === "my-computer") {
            setSelected(null);
            alert("You cannot open hard disk now.(wait for further updates)");
            return;
          }
          setSelected("my-computer");
        }}
      >
        <div className="m-auto text-center break-words">
          <img
            className={clsx("h-24 w-24 ", {
              "saturate-200": selected === "my-computer",
            })}
            src="/hackbook-W95/hard-disk.png"
          />
          <h4
            className={clsx("w-24 text-sm ", {
              "text-white bg-blue-700": selected === "my-computer",
            })}
          >
            Hard Disk (C:)
          </h4>
        </div>
      </div>
    </div>
  );
};

export default MyComputer;

"use client";

const InternetExplorer = ({ link }: { link: string }) => {
  return <iframe id="webFrame" src={link} className={`w-full h-full m-auto overscroll-none`} />;
};

export default InternetExplorer;

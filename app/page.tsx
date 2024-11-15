import Link from "next/link";

export default function Page() {
  return (
    <div className="flex flex-col justify-center w-screen h-screen">
      <div className="m-auto">
        <h1 className="text-white text-center">Welcome to hack-a-byte</h1>
        <Link href="/login" className="text-blue-400">join</Link>
      </div>
    </div>
  );
}

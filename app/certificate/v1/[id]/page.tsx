import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, QrCode, Trophy, Users, Code, Cpu, Terminal, Shield, Zap, Fingerprint } from "lucide-react";
import PrintButton from "@/components/ui/print-button";
import { getCertificate } from "@/app/lib/actions";

export default async function Page({ params }: { params: { id: string } }) {
  const certificate = await getCertificate(params.id);

  if (!certificate) {
    return (
      <div className="bg-slate-200 text-center flex h-screen w-screen">
        <h1 className="m-auto">Certificate not found</h1>
      </div>
    );
  }

  const getAchievementIcon = (achievement: string) => {
    switch (achievement) {
      case "WINNER":
        return <Trophy className="w-8 h-8 text-cyan-400" />;
      case "TEAMWORK":
        return <Users className="w-8 h-8 text-cyan-400" />;
      case "CODING":
        return <Code className="w-8 h-8 text-cyan-400" />;
      case "HARDWARE":
        return <Cpu className="w-8 h-8 text-cyan-400" />;
      default:
        return null;
    }
  };

  const getSkillIcon = (skill: string) => {
    switch (skill) {
      case "Command Line Mastery":
        return <Terminal className="w-6 h-6 text-cyan-400" />;
      case "Digital Threat Identification":
        return <Shield className="w-6 h-6 text-cyan-400" />;

      case "Critical Thinking":
        return <Zap className="w-6 h-6 text-cyan-400" />;

      case "Cyber Attack Prevention":
        return <Fingerprint className="w-6 h-6 text-cyan-400" />;

      default:
        return null;
    }
  };

  return (
    <>
      <PrintButton />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-6 flex items-center justify-center">
        <Card
          id="certificate"
          className="w-[1100px] aspect-[1.4/1] border-8 border-cyan-500 relative overflow-hidden bg-black text-white shadow-2xl"
        >
          <div className="absolute inset-0 bg-[url('/circuit-board.svg')] opacity-10"></div>
          <CardContent className="h-full p-8 relative flex flex-col">
            {/* Header */}
            <h1 className="text-6xl font-black text-center tracking-wider mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              HACK-A-BYTE CHAMPION
            </h1>

            {/* Certificate Title */}
            <div className="text-3xl font-bold mb-6 border-b-2 border-cyan-500 pb-2 text-center">
              {certificate.title}
            </div>

            <div className="flex flex-1 gap-8">
              {/* Left Column */}
              <div className="flex-1 space-y-6">
                {/* Name Section */}
                <div>
                  <div className="text-sm font-mono mb-1 text-cyan-400">AWARDED TO</div>
                  <div className="border-b-2 border-cyan-500 text-2xl font-bold py-2">{certificate.name}</div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "PARTICIPANT TYPE", value: certificate.participantType },
                    { label: "DATE", value: new Date(certificate.date).toDateString() },
                    { label: "TOTAL COMPETITORS", value: certificate.totalCompetitors },
                    { label: "RANK", value: certificate.rank },
                  ].map((item, index) => (
                    <div key={index} className="bg-gray-800 p-3 rounded-lg">
                      <div className="text-xs font-mono mb-1 text-cyan-400">{item.label}</div>
                      <div className="font-bold">{item.value}</div>
                    </div>
                  ))}
                </div>

                {/* Achievement Icons */}
                <div className="">
                  {certificate.achievements.map((achievement: string) => (
                    <div className="text-sm font-mono mb-1 text-cyan-400"> &gt; {achievement}</div>
                  ))}
                </div>
              </div>

              {/* Right Column */}
              <div className="flex-1 space-y-6">
                {/* Hacker Skills */}
                <div>
                  <h2 className="text-xl font-bold mb-3 text-cyan-400">HACKER SKILLS</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {certificate.skills.map((skill: string, index: number) => (
                      <div key={index} className="flex items-center gap-3 bg-gray-800 p-3 rounded-lg">
                        {getSkillIcon(skill)}
                        <span className="text-sm font-mono">{skill}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Byte Buster Challenge */}
                <div>
                  <h2 className="text-xl font-bold mb-3 text-cyan-400">BYTE BUSTER CHALLENGE</h2>
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="font-mono text-xs bg-black p-2 rounded">{certificate.challenge}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="flex justify-between items-end mt-6 pt-6 border-t-2 border-cyan-500">
              <div className="flex items-center gap-4">
                <Database className="w-12 h-12 text-cyan-400" />
                <div className="text-lg font-bold">
                  HACK-A-BYTE
                  <br />
                  CHAMPION
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="relative w-24 h-24 mb-2">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://hack-a-byte.vercel.app/certificate/v1/${params.id}&color=22d3ee&bgcolor=000000`}
                    alt="QR Code"
                    className="absolute inset-0 w-full h-full opacity-100"
                  />
                </div>
                <div className="text-xs font-mono text-center">SCAN FOR VERIFICATION</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 border-2 border-cyan-500 rounded-full flex items-center justify-center">
                  <div className="w-8 h-8 bg-cyan-500 rounded-full"></div>
                </div>
                <div className="border-b-2 border-cyan-500 w-32"></div>
              </div>
            </div>

            {/* Certificate Competition */}
            <div className="absolute bottom-8 right-8 text-right">
              <div className="text-sm font-mono text-cyan-400">CERTIFICATE COMPETITION</div>
              <div className="border-b-2 border-cyan-500 w-48 ml-auto"></div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-6 left-6 w-12 h-12 border-t-4 border-l-4 border-cyan-500 rounded-tl-xl"></div>
            <div className="absolute top-6 right-6 w-12 h-12 border-t-4 border-r-4 border-cyan-500 rounded-tr-xl"></div>
            <div className="absolute bottom-6 left-6 w-12 h-12 border-b-4 border-l-4 border-cyan-500 rounded-bl-xl"></div>
            <div className="absolute bottom-6 right-6 w-12 h-12 border-b-4 border-r-4 border-cyan-500 rounded-br-xl"></div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

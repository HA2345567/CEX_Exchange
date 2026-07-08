"use client";
import { usePathname, useRouter } from "next/navigation";

export const Appbar = () => {
  const route = usePathname();
  const router = useRouter();

  return (
    <div className="border-b border-slate-800 text-white">
      <div className="flex items-center justify-between p-2">
        <div className="flex">
          <div className="flex cursor-pointer flex-col justify-center pl-4 text-xl text-white">
            Exchange
          </div>
          <div
            className={`flex cursor-pointer flex-col justify-center pl-8 pt-1 text-sm ${
              route.startsWith("/markets") ? "text-white" : "text-slate-500"
            }`}
            onClick={() => router.push("/markets")}
          >
            Markets
          </div>
          <div
            className={`flex cursor-pointer flex-col justify-center pl-8 pt-1 text-sm ${
              route.startsWith("/trade") ? "text-white" : "text-slate-500"
            }`}
            onClick={() => router.push("/trade/TATA_INR")}
          >
            Trade
          </div>
        </div>
        <div className="flex">
          <div className="mr-2 p-2">
            {/* <SuccessButton>Deposit</SuccessButton>
            <PrimaryButton>Withdraw</PrimaryButton> */}
          </div>
        </div>
      </div>
    </div>
  );
};


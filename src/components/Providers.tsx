"use client";

import AppContextProvider from "@/context/AppContext";
import DoctorContextProvider from "@/context/DoctorContext";
import AdminContextProvider from "@/context/AdminContext";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppContextProvider>
      <DoctorContextProvider>
        <AdminContextProvider>{children}</AdminContextProvider>
      </DoctorContextProvider>
    </AppContextProvider>
  );
}

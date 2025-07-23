"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type ProjectRefreshContextType = {
  refreshCount: number;
  triggerRefresh: () => void;
};

const ProjectRefreshContext = createContext<ProjectRefreshContextType | undefined>(undefined);

export const ProjectRefreshProvider = ({ children }: { children: ReactNode }) => {
  const [refreshCount, setRefreshCount] = useState(0);

  const triggerRefresh = () => {
    setRefreshCount((prev) => prev + 1);
  };

  return (
    <ProjectRefreshContext.Provider value={{ refreshCount, triggerRefresh }}>
      {children}
    </ProjectRefreshContext.Provider>
  );
};

export const useProjectRefresh = () => {
  const context = useContext(ProjectRefreshContext);
  if (!context) {
    throw new Error("useProjectRefresh must be used within a ProjectRefreshProvider");
  }
  return context;
};

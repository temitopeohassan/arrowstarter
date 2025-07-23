"use client";

import { useEffect, useState, useContext } from "react";
import { API_BASE_URL } from "../app/config";
import { useProjectRefresh } from "@/context/ProjectRefreshContext";
import { BackProjectModal } from "./BackProjectModal";

type Project = {
  id: string;
  title: string;
  description: string;
  image?: string;
  status: string;
  category: string;
  goal: number;
  raised: number;
  supporters: number;
  creatorAddress: string;
};

export function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const { refreshCount } = useProjectRefresh();


  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await fetch(`${API_BASE_URL}/api/projects`);
      if (!response.ok) throw new Error("Failed to fetch projects");
      const data = await response.json();
      setProjects(data);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError("Failed to load projects.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [refreshCount]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="rounded-lg border bg-card shadow-sm animate-pulse overflow-hidden"
          >
            <div className="aspect-video bg-muted" />
            <div className="p-4 space-y-4">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => {
          const percentRaised =
            project.goal > 0
              ? Math.round((project.raised / project.goal) * 100)
              : null;

          return (
            <div
              key={project.id}
              className="rounded-lg border bg-card shadow-sm hover:shadow-lg transition-shadow overflow-hidden"
            >
              <div className="relative">
                <img
                  src={project.image || "/placeholder.png"}
                  alt={project.title}
                  className="w-full aspect-video object-cover"
                />
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-background/80 backdrop-blur-sm capitalize">
                    {project.category}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-white ${
                      project.status === "Funding Open"
                        ? "bg-blue-500"
                        : project.status === "Completed"
                        ? "bg-green-500"
                        : "bg-yellow-500"
                    }`}
                  >
                    {project.status}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <div className="text-sm text-muted-foreground mb-1">
                  {project.creatorAddress.slice(0, 6)}...
                  {project.creatorAddress.slice(-4)}
                </div>
                <h3 className="text-lg font-semibold mb-2 line-clamp-1">
                  {project.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {project.description}
                </p>

                <div className="space-y-3 mb-4">
                  {percentRaised !== null ? (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{percentRaised}%</span>
                      </div>
                      <div
                        className="relative h-4 w-full overflow-hidden rounded-full bg-secondary"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={percentRaised}
                      >
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${percentRaised}%` }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {project.raised} / {project.goal} ETH
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Raised</span>
                        <span className="font-medium">{project.raised} ETH</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Supporters</span>
                        <span className="font-medium">{project.supporters}</span>
                      </div>
                    </>
                  )}
                </div>

                <button
                  className="w-full h-10 px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  onClick={() => {
                    if (project.status === "Funding Open") {
                      setSelectedProject(project);
                    }
                  }}
                >
                  {project.status === "Funding Open"
                    ? "Back This Project"
                    : "View Project"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedProject && (
        <BackProjectModal
          isOpen={!!selectedProject}
          onClose={() => setSelectedProject(null)}
          project={{
            id: selectedProject.id,
            title: selectedProject.title,
            goal: selectedProject.goal,
            raised: selectedProject.raised,
          }}
          onSuccess={() => {
            fetchProjects();
            setSelectedProject(null);
          }}
        />
      )}
    </>
  );
}

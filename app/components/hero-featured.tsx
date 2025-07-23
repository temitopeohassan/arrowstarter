"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Film } from "lucide-react";
import { BackProjectModal } from "./BackProjectModal";
import { API_BASE_URL } from "../app/config";

type Project = {
  id: string;
  title: string;
  description: string;
  raised: number;
  goal: number;
  percentage?: number;
  daysLeft: string;
  supporters: number;
  status: string;
  image: string;
  category: string;
  creator: string;
  avatar: string;
};

export function HeroFeatured() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const fetchFeaturedProjects = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/hero-featured`);
      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }

      const data: Project[] = await res.json();

      // No featured projects? Just show the "no projects" UI
      setProjects(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(err);
      setFetchError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeaturedProjects();
  }, []);

  if (loading) {
    return (
      <section className="py-12 md:py-20">
        <div className="container mx-auto animate-pulse">
          <div className="h-12 bg-muted rounded w-1/3 mb-4" />
          <div className="h-6 bg-muted rounded w-1/4 mb-2" />
          <div className="h-4 bg-muted rounded w-2/3" />
        </div>
      </section>
    );
  }

  if (fetchError) {
    return (
      <section className="py-12 md:py-20 text-center text-destructive">
        <p>{fetchError}</p>
      </section>
    );
  }

  if (projects.length === 0) {
    return (
      <section className="py-12 md:py-20 text-center text-muted-foreground">
        <p>No featured projects available at the moment.</p>
      </section>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Featured Project</h2>

      {projects.map((project) => {
        const progress = Math.min(
          Math.round((project.raised / project.goal) * 100),
          100
        );

        return (
          <div
            key={project.id}
            className="relative rounded-xl overflow-hidden bg-gradient-to-r from-primary/10 to-secondary/10 border mb-10"
          >
            <div className="grid lg:grid-cols-2 gap-6 p-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-primary text-primary-foreground">
                      Featured
                    </span>
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize text-foreground">
                      {project.category}
                    </span>
                  </div>
                  <h2 className="text-3xl font-bold">{project.title}</h2>
                  <div className="flex items-center gap-2">
                    <img
                      src={project.avatar}
                      alt={project.creator}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span className="text-muted-foreground">
                      by {project.creator}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-lg">
                    {project.description}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Funding Progress
                      </span>
                      <span className="font-semibold">{progress}%</span>
                    </div>
                    <div
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={progress}
                      className="relative w-full overflow-hidden rounded-full bg-secondary h-3"
                    >
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{project.raised} raised</span>
                      <span>Goal: {project.goal}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Film className="w-4 h-4" />
                      <span>{project.daysLeft}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    className="h-11 rounded-md px-8"
                    onClick={() => setSelectedProject(project)}
                  >
                    Back This Project
                  </Button>
                </div>
              </div>

              <div>
                <img
                  src={project.image}
                  alt={project.title}
                  className="rounded-lg w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        );
      })}

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
            fetchFeaturedProjects();
            setSelectedProject(null);
          }}
        />
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Film, Book, Music, Search } from "lucide-react";
import Link from "next/link";
// ...top imports unchanged
import { Progress } from "@/components/ui/progress"; 
import { API_BASE_URL } from "../config";

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/projects`);
        if (!response.ok) throw new Error("Failed to fetch projects");
        const data = await response.json();
        setProjects(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const filteredProjects = projects.filter((project: any) => {
    const matchesSearch =
      project.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = category === "all" || project.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">All Projects</h1>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="movies">Movies</SelectItem>
              <SelectItem value="books">Books</SelectItem>
              <SelectItem value="albums">Albums</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Status */}
      {loading && <p className="text-muted-foreground">Loading projects...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      {/* Projects Grid */}
      {!loading && !error && (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project: any) => {
              const percentRaised =
                project.goal > 0
                  ? Math.round((project.raised / project.goal) * 100)
                  : null;

              return (
                <Card key={project.id} className="overflow-hidden">
                  <div className="aspect-video relative">
                    <img
                      src={project.image || "/placeholder.jpg"}
                      alt={project.title}
                      className="object-cover w-full h-full"
                    />
                  </div>

                  <CardHeader>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm text-muted-foreground capitalize">
                        {project.type}
                      </span>
                    </div>
                    <CardTitle className="line-clamp-1">{project.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {project.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {percentRaised !== null && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{percentRaised}%</span>
                        </div>
                        <div className="relative h-4 w-full overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${percentRaised}%` }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {project.raised} / {project.goal} ETH
                        </div>
                      </>
                    )}

                    {percentRaised === null && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Raised</span>
                          <span className="font-medium">{project.raised}</span>
                        </div>
                      </>
                    )}

                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Supporters</span>
                      <span className="font-medium">{project.supporters}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <span className="font-medium">{project.status}</span>
                    </div>

                    <Button className="w-full mt-4" asChild>
                      <Link href={`/projects/${project.id}`}>
                        {project.status === "Funding Open"
                          ? "Back This Project"
                          : "View Project"}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredProjects.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold mb-2">No projects found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}


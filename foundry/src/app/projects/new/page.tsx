import { ProjectForm } from "@/features/project-creation/project-form";

export default function NewProjectPage() {
  return (
    <main className="page-gradient min-h-[calc(100vh-3.5rem)] px-4 py-8 sm:px-6 lg:px-8">
      <ProjectForm />
    </main>
  );
}
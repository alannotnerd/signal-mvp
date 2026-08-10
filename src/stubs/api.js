// Mock API — simulates backend responses with static JSON from public/stubs/

export async function fetchProjects() {
  const res = await fetch('/stubs/projects.json')
  return (await res.json()).projects
}

export async function fetchProject(id) {
  const res = await fetch(`/stubs/project-${id}.json`)
  if (!res.ok) return null
  return await res.json()
}

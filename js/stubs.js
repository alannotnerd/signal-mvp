// Stub API — simulates backend responses with static JSON data
const Stubs = {
  base: 'stubs/',

  async fetch(path) {
    try {
      const res = await fetch(this.base + path);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.error(`Stub fetch failed: ${path}`, e);
      return null;
    }
  },

  async getProjects() {
    const data = await this.fetch('projects.json');
    return data ? data.projects : [];
  },

  async getProject(id) {
    return await this.fetch(`project-${id}.json`);
  }
};

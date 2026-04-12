export interface Project {
  id: string;
  name: string;
  description: string | null;
  sandboxProvider: string;
  defaultModel: string | null;
  defaultConnectionMode: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  sandboxProvider?: string;
  defaultModel?: string;
  defaultConnectionMode?: string;
  createdBy: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  sandboxProvider?: string;
  defaultModel?: string;
  defaultConnectionMode?: string;
}

export interface ProjectDb {
  create(input: CreateProjectInput): Promise<Project>;
  findById(id: string): Promise<Project | null>;
  findByUser(userId: string, includeDeleted?: boolean): Promise<Project[]>;
  update(id: string, input: UpdateProjectInput): Promise<Project | null>;
  softDelete(id: string): Promise<boolean>;
  restore(id: string): Promise<boolean>;
  hardDelete(id: string): Promise<boolean>;
  listDeleted(userId: string): Promise<Project[]>;
}

export class ProjectService {
  constructor(private db: ProjectDb) {}

  async create(input: CreateProjectInput): Promise<Project> {
    if (!input.name.trim()) {
      throw new Error('Project name is required');
    }
    if (input.name.length > 255) {
      throw new Error('Project name must be 255 characters or less');
    }
    return this.db.create(input);
  }

  async getById(id: string): Promise<Project | null> {
    const project = await this.db.findById(id);
    if (project?.deletedAt) return null;
    return project;
  }

  async getByIdIncludeDeleted(id: string): Promise<Project | null> {
    return this.db.findById(id);
  }

  async listByUser(userId: string): Promise<Project[]> {
    return this.db.findByUser(userId, false);
  }

  async update(id: string, input: UpdateProjectInput): Promise<Project> {
    if (input.name !== undefined) {
      if (!input.name.trim()) throw new Error('Project name is required');
      if (input.name.length > 255) throw new Error('Project name must be 255 characters or less');
    }
    const project = await this.db.findById(id);
    if (!project) throw new Error('Project not found');
    if (project.deletedAt) throw new Error('Cannot update a deleted project');
    const updated = await this.db.update(id, input);
    if (!updated) throw new Error('Project not found');
    return updated;
  }

  async softDelete(id: string): Promise<void> {
    const project = await this.db.findById(id);
    if (!project) throw new Error('Project not found');
    if (project.deletedAt) throw new Error('Project is already deleted');
    const deleted = await this.db.softDelete(id);
    if (!deleted) throw new Error('Project not found (concurrent modification)');
  }

  async restore(id: string): Promise<Project> {
    const project = await this.db.findById(id);
    if (!project) throw new Error('Project not found');
    if (!project.deletedAt) throw new Error('Project is not deleted');
    const restored = await this.db.restore(id);
    if (!restored) throw new Error('Project not found (concurrent modification)');
    const fresh = await this.db.findById(id);
    if (!fresh) throw new Error('Project not found after restore');
    return fresh;
  }

  async listTrash(userId: string): Promise<Project[]> {
    return this.db.listDeleted(userId);
  }

  async permanentDelete(id: string): Promise<void> {
    const project = await this.db.findById(id);
    if (!project) throw new Error('Project not found');
    if (!project.deletedAt) {
      throw new Error('Project must be soft-deleted before permanent deletion');
    }
    const deleted = await this.db.hardDelete(id);
    if (!deleted) throw new Error('Project not found (concurrent modification)');
  }
}

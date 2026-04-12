import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  type CreateProjectInput,
  type Project,
  type ProjectDb,
  ProjectService,
  type UpdateProjectInput,
} from '../project/project-service.js';

class InMemoryProjectDb implements ProjectDb {
  private projects = new Map<string, Project>();

  async create(input: CreateProjectInput): Promise<Project> {
    const now = new Date();
    const project: Project = {
      id: randomUUID(),
      name: input.name,
      description: input.description ?? null,
      sandboxProvider: input.sandboxProvider ?? 'opensandbox',
      defaultModel: input.defaultModel ?? null,
      defaultConnectionMode: input.defaultConnectionMode ?? 'anthropic',
      createdBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    this.projects.set(project.id, project);
    return project;
  }

  async findById(id: string): Promise<Project | null> {
    return this.projects.get(id) ?? null;
  }

  async findByUser(userId: string, includeDeleted = false): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(
      (p) => p.createdBy === userId && (includeDeleted || !p.deletedAt)
    );
  }

  async update(id: string, input: UpdateProjectInput): Promise<Project | null> {
    const project = this.projects.get(id);
    if (!project) return null;
    if (input.name !== undefined) project.name = input.name;
    if (input.description !== undefined) project.description = input.description;
    if (input.sandboxProvider !== undefined) project.sandboxProvider = input.sandboxProvider;
    if (input.defaultModel !== undefined) project.defaultModel = input.defaultModel;
    if (input.defaultConnectionMode !== undefined)
      project.defaultConnectionMode = input.defaultConnectionMode;
    project.updatedAt = new Date();
    return project;
  }

  async softDelete(id: string): Promise<boolean> {
    const project = this.projects.get(id);
    if (!project) return false;
    project.deletedAt = new Date();
    return true;
  }

  async restore(id: string): Promise<boolean> {
    const project = this.projects.get(id);
    if (!project) return false;
    project.deletedAt = null;
    return true;
  }

  async hardDelete(id: string): Promise<boolean> {
    return this.projects.delete(id);
  }

  async listDeleted(userId: string): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(
      (p) => p.createdBy === userId && p.deletedAt !== null
    );
  }
}

describe('ProjectService', () => {
  let db: InMemoryProjectDb;
  let service: ProjectService;
  const userId = randomUUID();

  beforeEach(() => {
    db = new InMemoryProjectDb();
    service = new ProjectService(db);
  });

  describe('create', () => {
    it('creates a project with required fields', async () => {
      const project = await service.create({ name: 'My Project', createdBy: userId });
      expect(project.name).toBe('My Project');
      expect(project.createdBy).toBe(userId);
      expect(project.id).toBeDefined();
      expect(project.deletedAt).toBeNull();
    });

    it('creates a project with optional fields', async () => {
      const project = await service.create({
        name: 'Full Project',
        description: 'A test project',
        sandboxProvider: 'docker',
        defaultModel: 'claude-opus-4-6',
        defaultConnectionMode: 'bedrock',
        createdBy: userId,
      });
      expect(project.description).toBe('A test project');
      expect(project.sandboxProvider).toBe('docker');
      expect(project.defaultModel).toBe('claude-opus-4-6');
    });

    it('rejects empty name', async () => {
      await expect(service.create({ name: '', createdBy: userId })).rejects.toThrow(
        'name is required'
      );
    });

    it('rejects whitespace-only name', async () => {
      await expect(service.create({ name: '   ', createdBy: userId })).rejects.toThrow(
        'name is required'
      );
    });

    it('rejects name over 255 chars', async () => {
      await expect(service.create({ name: 'x'.repeat(256), createdBy: userId })).rejects.toThrow(
        '255 characters'
      );
    });
  });

  describe('getById', () => {
    it('returns project by id', async () => {
      const created = await service.create({ name: 'Test', createdBy: userId });
      const found = await service.getById(created.id);
      expect(found?.name).toBe('Test');
    });

    it('returns null for non-existent', async () => {
      expect(await service.getById(randomUUID())).toBeNull();
    });

    it('returns null for soft-deleted project', async () => {
      const created = await service.create({ name: 'Test', createdBy: userId });
      await service.softDelete(created.id);
      expect(await service.getById(created.id)).toBeNull();
    });

    it('getByIdIncludeDeleted returns soft-deleted', async () => {
      const created = await service.create({ name: 'Test', createdBy: userId });
      await service.softDelete(created.id);
      const found = await service.getByIdIncludeDeleted(created.id);
      expect(found?.deletedAt).not.toBeNull();
    });
  });

  describe('listByUser', () => {
    it('lists active projects for user', async () => {
      await service.create({ name: 'P1', createdBy: userId });
      await service.create({ name: 'P2', createdBy: userId });
      const list = await service.listByUser(userId);
      expect(list).toHaveLength(2);
    });

    it('excludes soft-deleted projects', async () => {
      const p1 = await service.create({ name: 'P1', createdBy: userId });
      await service.create({ name: 'P2', createdBy: userId });
      await service.softDelete(p1.id);
      const list = await service.listByUser(userId);
      expect(list).toHaveLength(1);
    });

    it('excludes other users projects', async () => {
      await service.create({ name: 'P1', createdBy: userId });
      await service.create({ name: 'P2', createdBy: randomUUID() });
      const list = await service.listByUser(userId);
      expect(list).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('updates project fields', async () => {
      const created = await service.create({ name: 'Original', createdBy: userId });
      const updated = await service.update(created.id, {
        name: 'Updated',
        description: 'New desc',
      });
      expect(updated.name).toBe('Updated');
      expect(updated.description).toBe('New desc');
    });

    it('throws for non-existent project', async () => {
      await expect(service.update(randomUUID(), { name: 'X' })).rejects.toThrow('not found');
    });

    it('throws for deleted project', async () => {
      const created = await service.create({ name: 'Test', createdBy: userId });
      await service.softDelete(created.id);
      await expect(service.update(created.id, { name: 'X' })).rejects.toThrow('deleted');
    });

    it('validates name on update', async () => {
      const created = await service.create({ name: 'Test', createdBy: userId });
      await expect(service.update(created.id, { name: '' })).rejects.toThrow('name is required');
    });
  });

  describe('soft delete and restore', () => {
    it('soft deletes a project', async () => {
      const created = await service.create({ name: 'Test', createdBy: userId });
      await service.softDelete(created.id);
      expect(await service.getById(created.id)).toBeNull();
    });

    it('throws when deleting non-existent', async () => {
      await expect(service.softDelete(randomUUID())).rejects.toThrow('not found');
    });

    it('throws when deleting already deleted', async () => {
      const created = await service.create({ name: 'Test', createdBy: userId });
      await service.softDelete(created.id);
      await expect(service.softDelete(created.id)).rejects.toThrow('already deleted');
    });

    it('restores a soft-deleted project', async () => {
      const created = await service.create({ name: 'Test', createdBy: userId });
      await service.softDelete(created.id);
      const restored = await service.restore(created.id);
      expect(restored.deletedAt).toBeNull();
      expect(await service.getById(created.id)).not.toBeNull();
    });

    it('throws when restoring non-deleted', async () => {
      const created = await service.create({ name: 'Test', createdBy: userId });
      await expect(service.restore(created.id)).rejects.toThrow('not deleted');
    });
  });

  describe('trash', () => {
    it('lists deleted projects', async () => {
      const p1 = await service.create({ name: 'P1', createdBy: userId });
      await service.create({ name: 'P2', createdBy: userId });
      await service.softDelete(p1.id);
      const trash = await service.listTrash(userId);
      expect(trash).toHaveLength(1);
      expect(trash[0].name).toBe('P1');
    });
  });

  describe('permanent delete', () => {
    it('permanently deletes a soft-deleted project', async () => {
      const created = await service.create({ name: 'Test', createdBy: userId });
      await service.softDelete(created.id);
      await service.permanentDelete(created.id);
      expect(await service.getByIdIncludeDeleted(created.id)).toBeNull();
    });

    it('throws when permanently deleting active project', async () => {
      const created = await service.create({ name: 'Test', createdBy: userId });
      await expect(service.permanentDelete(created.id)).rejects.toThrow(
        'must be soft-deleted before permanent deletion'
      );
    });

    it('throws for non-existent project', async () => {
      await expect(service.permanentDelete(randomUUID())).rejects.toThrow('not found');
    });
  });
});

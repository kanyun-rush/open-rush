/**
 * 工作区路径管理
 *
 * 约定项目工作区路径为 /home/user/workspace/，
 * 每个项目在 /home/user/workspace/{projectId}/ 下。
 *
 * 可通过环境变量 WORKSPACE_PATH 覆盖（用于本地开发和测试）。
 */

import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

/** 默认工作区根目录（沙箱容器内） */
const DEFAULT_WORKSPACE_PATH = '/home/user/workspace';

/** 已初始化的工作区路径缓存，避免重复 existsSync 磁盘 IO */
let initializedWorkspacePath: string | null = null;

/**
 * 获取工作区根路径
 *
 * 优先级：
 * 1. 环境变量 WORKSPACE_PATH（用于本地开发/测试）
 * 2. 默认路径 /home/user/workspace
 *
 * 首次调用时创建目录，后续调用直接返回缓存路径。
 */
export function getWorkspacePath(): string {
  const workspacePath = process.env.WORKSPACE_PATH ?? DEFAULT_WORKSPACE_PATH;

  if (initializedWorkspacePath !== workspacePath) {
    console.log(`[Workspace] 确保工作区目录存在: ${workspacePath}`);
    mkdirSync(workspacePath, { recursive: true });
    initializedWorkspacePath = workspacePath;
  }

  return workspacePath;
}

/** 重置缓存（仅用于测试） */
export function resetWorkspaceCache(): void {
  initializedWorkspacePath = null;
}

/**
 * 获取工作区路径（末尾带斜杠）
 *
 * 适用于路径拼接场景：`${workspacePathWithSlash}${projectId}`
 */
export function getWorkspacePathWithSlash(): string {
  return `${getWorkspacePath()}/`;
}

/**
 * 获取项目路径
 *
 * @param projectId 项目 ID
 * @returns 项目完整路径，如 /home/user/workspace/p_abc123
 */
export function getProjectPath(projectId: string): string {
  return join(getWorkspacePath(), projectId);
}

/**
 * 确保项目目录存在
 *
 * @param projectId 项目 ID
 * @returns 项目完整路径
 */
export function ensureProjectDir(projectId: string): string {
  validateProjectId(projectId);
  const projectPath = getProjectPath(projectId);
  mkdirSync(projectPath, { recursive: true });
  return projectPath;
}

/**
 * 校验 projectId 格式，防止路径遍历
 *
 * 只允许字母、数字、下划线、横杠、点号，禁止 .. / \ 等危险字符。
 */
const PROJECT_ID_PATTERN = /^[a-zA-Z0-9_-][a-zA-Z0-9._-]*$/;

export function validateProjectId(projectId: string): void {
  if (!projectId || !PROJECT_ID_PATTERN.test(projectId)) {
    throw new Error(
      `[Workspace] Invalid projectId: "${projectId}". Only alphanumeric, underscore, hyphen, and dot are allowed.`
    );
  }
}

/**
 * 检查路径是否在工作区内
 */
export function isPathInWorkspace(path: string): boolean {
  const workspacePath = getWorkspacePath();
  const normalizedPath = path.toLowerCase();
  const normalizedWorkspace = workspacePath.toLowerCase();

  if (!normalizedPath.startsWith(normalizedWorkspace)) {
    return false;
  }
  if (normalizedPath.length === normalizedWorkspace.length) {
    return true;
  }
  return normalizedPath[normalizedWorkspace.length] === '/';
}

import { HttpClient } from '@angular/common/http';
import { isPlatformServer } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { defer, from } from 'rxjs';
import { Project } from '../models/project.model';

@Injectable({
  providedIn: 'root',
})
export class ProjectContentService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  getProjects() {
    if (isPlatformServer(this.platformId)) {
      return defer(() => from(this.readProjectsFile()));
    }

    return this.http.get<Project[]>('/assets/projects.json');
  }

  private async readProjectsFile(): Promise<Project[]> {
    const [{ readFile }, { join }] = await Promise.all([loadNodeFs(), loadNodePath()]);
    const filePath = join(getProcessCwd(), 'src', 'assets', 'projects.json');
    const raw = await readFile(filePath, 'utf8');

    return JSON.parse(raw) as Project[];
  }
}

interface NodeFsModule {
  readFile(path: string, encoding: string): Promise<string>;
}

interface NodePathModule {
  join(...paths: string[]): string;
}

function loadNodeFs(): Promise<NodeFsModule> {
  return new Function('return import("node:fs/promises")')() as Promise<NodeFsModule>;
}

function loadNodePath(): Promise<NodePathModule> {
  return new Function('return import("node:path")')() as Promise<NodePathModule>;
}

function getProcessCwd(): string {
  const processRef = (globalThis as typeof globalThis & {
    process?: { cwd?: () => string };
  }).process;

  if (!processRef?.cwd) {
    throw new Error('Process cwd is not available in the current runtime.');
  }

  return processRef.cwd();
}

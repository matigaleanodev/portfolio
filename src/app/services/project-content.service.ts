import { HttpClient } from '@angular/common/http';
import { isPlatformServer } from '@angular/common';
import { inject, Injectable, makeStateKey, PLATFORM_ID, TransferState } from '@angular/core';
import { defer, from, of, shareReplay, tap } from 'rxjs';
import { Project } from '../models/project.model';

const PROJECTS_KEY = makeStateKey<Project[]>('projects');

@Injectable({
  providedIn: 'root',
})
export class ProjectContentService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly transferState = inject(TransferState);

  // El destacado y la lista comparten la carga; tras un error se vuelve a pedir.
  private readonly request$ = this.http
    .get<Project[]>('/assets/projects.json')
    .pipe(shareReplay({ bufferSize: 1, refCount: false }));

  getProjects() {
    if (isPlatformServer(this.platformId)) {
      return defer(() => from(this.readProjectsFile())).pipe(
        tap((projects) => this.transferState.set(PROJECTS_KEY, projects)),
      );
    }

    // La hidratación necesita los datos en forma síncrona para conservar el prerender.
    const transferred = this.transferState.get(PROJECTS_KEY, null);
    if (transferred) return of(transferred);

    return this.request$;
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
  const processRef = (
    globalThis as typeof globalThis & {
      process?: { cwd?: () => string };
    }
  ).process;

  if (!processRef?.cwd) {
    throw new Error('Process cwd is not available in the current runtime.');
  }

  return processRef.cwd();
}

import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';

type WorkspaceMirrorPlacement = 'main' | 'local' | 'async-subpackage';

interface WorkspaceMirrorEntry {
  prefix: string;
  sourceDir: string;
  outputDir: string;
  placement: WorkspaceMirrorPlacement;
}

interface GeneratedTarget {
  root: string;
  generatedDir: string;
}

interface UniWorkspaceMirrorPluginOptions {
  generatedDir: string;
  subpackages?: GeneratedTarget[];
  asyncSubpackages?: GeneratedTarget[];
  sourceRootDir: string;
  entries: WorkspaceMirrorEntry[];
}

function normalizePath(path: string) {
  return path.replace(/\\/g, '/');
}

function isInside(parent: string, child: string) {
  const normalizedParent = normalizePath(parent).replace(/\/+$/, '');
  const normalizedChild = normalizePath(child).replace(/\/+$/, '');

  return normalizedChild === normalizedParent || normalizedChild.startsWith(`${normalizedParent}/`);
}

function copyDirectory(sourceDir: string, targetDir: string) {
  if (!existsSync(sourceDir)) {
    return;
  }

  mkdirSync(targetDir, { recursive: true });

  for (const entry of readdirSync(sourceDir)) {
    const source = join(sourceDir, entry);
    const target = join(targetDir, entry);

    if (statSync(source).isDirectory()) {
      copyDirectory(source, target);
      continue;
    }

    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(source, target);
  }
}

function resolveExistingFile(path: string) {
  if (existsSync(path)) {
    return path;
  }

  for (const extension of ['.ts', '.vue']) {
    const candidate = `${path}${extension}`;

    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return path;
}

export function uniWorkspaceMirrorPlugin(options: UniWorkspaceMirrorPluginOptions) {
  const subpackages = (options.subpackages ?? []).map((subpackage) => ({
    root: normalizePath(subpackage.root),
    generatedDir: subpackage.generatedDir,
  }));
  const asyncSubpackages = (options.asyncSubpackages ?? []).map((subpackage) => ({
    root: normalizePath(subpackage.root),
    generatedDir: subpackage.generatedDir,
  }));

  function getLocalGeneratedDir(importer?: string) {
    if (!importer) {
      return options.generatedDir;
    }

    const normalizedImporter = normalizePath(importer);
    const matchedSubpackage = subpackages.find((subpackage) => {
      return normalizedImporter === subpackage.root || normalizedImporter.startsWith(`${subpackage.root}/`);
    });

    return matchedSubpackage?.generatedDir ?? options.generatedDir;
  }

  function getGeneratedRoots(entry: WorkspaceMirrorEntry) {
    if (entry.placement === 'main') {
      return [options.generatedDir];
    }

    if (entry.placement === 'async-subpackage') {
      return asyncSubpackages.map((subpackage) => subpackage.generatedDir);
    }

    return [options.generatedDir, ...subpackages.map((subpackage) => subpackage.generatedDir)];
  }

  function getTargetDir(entry: WorkspaceMirrorEntry, generatedRoot: string) {
    return join(generatedRoot, entry.outputDir);
  }

  function removeTargetDir(entry: WorkspaceMirrorEntry, generatedRoot: string) {
    const targetDir = getTargetDir(entry, generatedRoot);

    if (!isInside(generatedRoot, targetDir)) {
      throw new Error(`Refusing to clean generated workspace target outside generated root: ${targetDir}`);
    }

    rmSync(targetDir, { force: true, maxRetries: 3, recursive: true, retryDelay: 100 });
  }

  function resolveGeneratedDir(entry: WorkspaceMirrorEntry, importer?: string) {
    if (entry.placement === 'main') {
      return options.generatedDir;
    }

    if (entry.placement === 'async-subpackage') {
      return asyncSubpackages[0]?.generatedDir ?? options.generatedDir;
    }

    return getLocalGeneratedDir(importer);
  }

  function isAsyncSubpackageImporter(importer?: string) {
    if (!importer) {
      return false;
    }

    const normalizedImporter = normalizePath(importer);

    return asyncSubpackages.some((subpackage) => {
      return normalizedImporter === subpackage.root || normalizedImporter.startsWith(`${subpackage.root}/`);
    });
  }

  function syncEntry(entry: WorkspaceMirrorEntry, clean: boolean) {
    const sourceDir = join(options.sourceRootDir, entry.sourceDir);

    for (const generatedRoot of getGeneratedRoots(entry)) {
      if (clean) {
        removeTargetDir(entry, generatedRoot);
      }

      copyDirectory(sourceDir, getTargetDir(entry, generatedRoot));
    }
  }

  function syncAll(clean: boolean) {
    for (const entry of options.entries) {
      syncEntry(entry, clean);
    }
  }

  function findEntryForFile(file: string) {
    return options.entries.find((entry) => {
      const sourceDir = join(options.sourceRootDir, entry.sourceDir);
      return file === sourceDir || file.startsWith(`${sourceDir}\\`) || file.startsWith(`${sourceDir}/`);
    });
  }

  return {
    name: 'uni-workspace-mirror',
    enforce: 'pre' as const,
    resolveId(source: string, importer?: string) {
      const entry = options.entries.find((entry) => source.startsWith(entry.prefix));

      if (!entry) {
        return;
      }

      if (entry.placement === 'async-subpackage' && !isAsyncSubpackageImporter(importer)) {
        console.warn(`${source} belongs to an async subpackage mirror; prefer pages.json usingComponents instead of static import.`);
      }

      return resolveExistingFile(join(resolveGeneratedDir(entry, importer), entry.outputDir, source.slice(entry.prefix.length)));
    },
    buildStart() {
      syncAll(true);
    },
    configureServer(server: { watcher: { add: (path: string) => void } }) {
      syncAll(true);
      server.watcher.add(options.sourceRootDir);
    },
    handleHotUpdate(ctx: { file: string }) {
      const file = ctx.file;

      if (file === options.sourceRootDir) {
        syncAll(true);
        return [];
      }

      if (file.startsWith(`${options.sourceRootDir}\\`) || file.startsWith(`${options.sourceRootDir}/`)) {
        const entry = findEntryForFile(file);

        if (entry) {
          syncEntry(entry, true);
        } else {
          syncAll(true);
        }

        return [];
      }
    },
  };
}

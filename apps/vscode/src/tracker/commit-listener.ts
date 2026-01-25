import * as vscode from "vscode";

import { HEARTBEAT_CATEGORY } from "@turbo/shared";

import type { LocalStorage } from "../storage/local";
import type { SerializedHeartbeat } from "../storage/queue";
import { getConfig, isPrivacyModeEnabled, isTrackingEnabled } from "../config";
import { getEditorName, getOS } from "../types/heartbeat";
import { getCurrentBranch, getLatestCommit, getProjectName } from "./git";

/**
 * Storage key for persisted commit SHAs
 */
const COMMIT_SHA_STORAGE_KEY = "kodo.lastCommitShas";

/**
 * Git extension API types
 * @see https://github.com/microsoft/vscode/blob/main/extensions/git/src/api/git.d.ts
 */
interface GitExtension {
  getAPI(version: 1): GitAPI;
}

interface GitAPI {
  repositories: Repository[];
  onDidOpenRepository: vscode.Event<Repository>;
}

interface Repository {
  rootUri: vscode.Uri;
  state: RepositoryState;
}

interface RepositoryState {
  HEAD: Ref | undefined;
  onDidChange: vscode.Event<void>;
}

interface Ref {
  commit: string | undefined;
}

/**
 * Check if commit tracking is enabled in settings
 */
const isCommitCaptureEnabled = (): boolean => {
  return getConfig().captureCommits;
};

/**
 * Create a commit listener that uses VS Code's Git extension API
 * to listen for HEAD changes (commits, pulls, rebases, etc.)
 *
 * Features:
 * - Event-driven: catches commits from IDE or terminal
 * - Persistent SHA storage: detects commits made while VS Code was closed
 * - Window focus check: catches pulls/fetches from other machines
 */
export const createCommitListener = (
  onHeartbeat: (heartbeat: SerializedHeartbeat) => void,
  storage: LocalStorage,
): vscode.Disposable => {
  const disposables: vscode.Disposable[] = [];

  // In-memory cache (fast lookups during session)
  const lastCommitSha = new Map<string, string | undefined>();

  /**
   * Get persisted SHAs from storage
   */
  const getPersistedShas = (): Record<string, string> => {
    return storage.get<Record<string, string>>(COMMIT_SHA_STORAGE_KEY, {});
  };

  /**
   * Persist SHA to storage
   */
  const persistSha = async (repoPath: string, sha: string): Promise<void> => {
    const shas = getPersistedShas();
    shas[repoPath] = sha;
    await storage.set(COMMIT_SHA_STORAGE_KEY, shas);
  };

  /**
   * Create a commit heartbeat
   */
  const createCommitHeartbeat = (
    workspaceFolder: string,
    commit: {
      sha: string;
      message: string;
      filesChanged: number;
      insertions: number;
      deletions: number;
    },
  ): SerializedHeartbeat => {
    const privacyMode = isPrivacyModeEnabled();

    return {
      timestamp: new Date().toISOString(),
      file: null, // Commits don't have a specific file
      project: privacyMode ? "private" : getProjectName(workspaceFolder),
      branch: privacyMode ? null : getCurrentBranch(workspaceFolder),
      language: "git", // Use "git" as the language for commits
      editor: getEditorName(),
      os: getOS(),
      isWrite: true, // Commits are always "writes"
      category: HEARTBEAT_CATEGORY.COMMITTING,
      // Commit-specific fields
      commitSha: commit.sha,
      commitMessage: privacyMode ? "[private]" : commit.message.slice(0, 2000), // Full commit message
      filesChanged: commit.filesChanged,
      insertions: commit.insertions,
      deletions: commit.deletions,
    };
  };

  /**
   * Track a commit if it's new (not seen before)
   * Returns true if commit was tracked
   */
  const trackCommitIfNew = async (
    repoPath: string,
    currentSha: string,
    source: "activation" | "focus" | "event",
  ): Promise<boolean> => {
    if (!isTrackingEnabled() || !isCommitCaptureEnabled()) return false;

    const persistedShas = getPersistedShas();
    const persistedSha = persistedShas[repoPath];
    const memorySha = lastCommitSha.get(repoPath);

    // Skip if we've already seen this SHA (in memory or persisted)
    if (currentSha === memorySha || currentSha === persistedSha) {
      return false;
    }

    // New commit detected!
    const commit = getLatestCommit(repoPath);
    if (commit) {
      const heartbeat = createCommitHeartbeat(repoPath, commit);
      onHeartbeat(heartbeat);
      console.log(
        `[Kodo]: 📦 Commit tracked (${source}): ${commit.sha} - ${commit.message.split("\n")[0]}`,
      );
    }

    // Update both memory and persisted storage
    lastCommitSha.set(repoPath, currentSha);
    await persistSha(repoPath, currentSha);

    return true;
  };

  /**
   * Check a repository for missed commits
   */
  const checkRepoForMissedCommits = async (
    repo: Repository,
    source: "activation" | "focus",
  ): Promise<void> => {
    const repoPath = repo.rootUri.fsPath;
    const currentSha = repo.state.HEAD?.commit;

    if (!currentSha) return;

    await trackCommitIfNew(repoPath, currentSha, source);
  };

  /**
   * Handle repository state change (HEAD changed) - event-driven
   */
  const handleRepositoryChange = (repo: Repository): void => {
    const repoPath = repo.rootUri.fsPath;
    const currentSha = repo.state.HEAD?.commit;

    if (!currentSha) return;

    void trackCommitIfNew(repoPath, currentSha, "event");
  };

  /**
   * Watch a repository for changes
   */
  const watchRepository = (repo: Repository): void => {
    const repoPath = repo.rootUri.fsPath;
    const currentSha = repo.state.HEAD?.commit;

    // Initialize memory cache from current state
    lastCommitSha.set(repoPath, currentSha);

    // Listen for state changes
    const stateDisposable = repo.state.onDidChange(() => {
      handleRepositoryChange(repo);
    });

    disposables.push(stateDisposable);
    console.log(`[Kodo]: 👀 Watching Git repo: ${repoPath}`);
  };

  /**
   * Check all repositories for missed commits
   */
  const checkAllReposForMissedCommits = async (
    git: GitAPI,
    source: "activation" | "focus",
  ): Promise<void> => {
    for (const repo of git.repositories) {
      await checkRepoForMissedCommits(repo, source);
    }
  };

  // Try to get the Git extension
  const gitExtension =
    vscode.extensions.getExtension<GitExtension>("vscode.git");

  let gitApi: GitAPI | null = null;

  if (gitExtension) {
    // Extension might not be activated yet
    const activateAndWatch = async () => {
      try {
        gitApi = gitExtension.isActive
          ? gitExtension.exports.getAPI(1)
          : (await gitExtension.activate()).getAPI(1);

        // Check for missed commits on activation (VS Code was closed)
        await checkAllReposForMissedCommits(gitApi, "activation");

        // Watch existing repositories
        for (const repo of gitApi.repositories) {
          watchRepository(repo);
        }

        // Watch newly opened repositories
        const openRepoDisposable = gitApi.onDidOpenRepository((repo) => {
          watchRepository(repo);
          // Also check for missed commits in newly opened repo
          void checkRepoForMissedCommits(repo, "activation");
        });

        disposables.push(openRepoDisposable);
        console.log(
          `[Kodo]: ✅ Git commit tracking active (${gitApi.repositories.length} repos)`,
        );
      } catch {
        console.log(
          "[Kodo]: ⚠️ Git extension not available, commit tracking disabled",
        );
      }
    };

    void activateAndWatch();

    // Listen for window focus to catch missed commits (e.g., pull from another machine)
    const focusDisposable = vscode.window.onDidChangeWindowState((state) => {
      if (state.focused && gitApi) {
        void checkAllReposForMissedCommits(gitApi, "focus");
      }
    });

    disposables.push(focusDisposable);
  } else {
    console.log("[Kodo]: ⚠️ Git extension not found, commit tracking disabled");
  }

  return {
    dispose: () => {
      for (const d of disposables) {
        d.dispose();
      }
      lastCommitSha.clear();
    },
  };
};

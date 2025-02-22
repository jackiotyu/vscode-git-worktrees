import * as util from "util";
import * as vscode from "vscode";
import { SpawnOptionsWithoutStdio, spawn } from "child_process";
import { EXTENSION_ID, DEMO_URL } from "../constants/constants";
import { showInformationMessageWithButton } from "./vsCodeHelpers";

const exec = util.promisify(require("child_process").exec);

export const getCurrentPath = () => vscode.workspace.rootPath;

export const getWorkspaceFilePath = () => vscode.workspace.workspaceFile;

export const copyToClipboard = async (content = "") =>
    await vscode.env.clipboard.writeText(util.inspect(content));

const calculateBrowserStart = async () => {
    let start = "xdg-open";

    if (process.platform === "darwin") start = "open";
    else if (process.platform === "win32") start = "start";

    return start;
};

export const openBrowser = async (url = "") => {
    const start = await calculateBrowserStart();
    await require("child_process").exec(start + " " + url);
};

export const executeCommand = async (
    command: string,
    options?: { cwd: string; [key: string]: any }
) => {
    try {
        const { stdout } = await exec(command, options);
        return { stdout };
    } catch (e: any) {
        const errorMessage = `command: '${command}'. error: '${e.message}'`;
        throw Error(errorMessage);
    }
};

// modified from https://stackoverflow.com/a/67379845/9979122
export const spawnCommand = async (
    command: string,
    args?: string[],
    options?: SpawnOptionsWithoutStdio
) => {
    return new Promise<{ stdout: string }>((resolve, reject) => {
        const stdoutChunks: Buffer[] = [];
        const stderrChunks: Buffer[] = [];

        const subprocess = spawn(command, args, options);

        subprocess.stdout.on("data", (chunk) => {
            stdoutChunks.push(chunk);
        });

        subprocess.stderr.on("data", (chunk) => {
            stderrChunks.push(chunk);
        });

        subprocess.on("error", (error) => {
            reject(error);
        });

        subprocess.on("exit", (code) => {
            if (code !== 0) {
                reject(Buffer.concat(stderrChunks).toString());
            }

            resolve({ stdout: Buffer.concat(stdoutChunks).toString() });
        });
    });
};

export const isMajorUpdate = (previousVersion: string, currentVersion: string) => {
    // rain-check for malformed string
    if (previousVersion.indexOf(".") === -1) return true;

    //returns int array [1,1,1] i.e. [major,minor,patch]
    const previousVerArr = previousVersion.split(".").map(Number);
    const currentVerArr = currentVersion.split(".").map(Number);

    if (currentVerArr[0] > previousVerArr[0]) return true;

    return false;
};

export const showWhatsNew = async (context: vscode.ExtensionContext) => {
    try {
        const previousVersion = context.globalState.get<string>(EXTENSION_ID);
        const currentVersion = vscode.extensions.getExtension(EXTENSION_ID)!.packageJSON.version;

        // store latest version
        context.globalState.update(EXTENSION_ID, currentVersion);

        if (previousVersion !== undefined && !isMajorUpdate(previousVersion, currentVersion))
            return;
        const buttonName = "View Demo";

        const answer = await showInformationMessageWithButton(
            `v${currentVersion} - Git Worktree Add Feature is now available!`,
            buttonName
        );

        if (answer !== buttonName) return;

        await openBrowser(DEMO_URL);
    } catch (e) {
        console.log("showWhatsNew: Error", e);
    }
};

export const shouldRemoveStalledBranches =
    vscode.workspace.getConfiguration().get("vsCodeGitWorktrees.remove.stalledBranches") ?? false;

export const shouldOpenNewVscodeWindow =
    vscode.workspace.getConfiguration().get("vsCodeGitWorktrees.move.openNewVscodeWindow") ?? true;

export const worktreesDirPath =
    vscode.workspace.getConfiguration().get("vsCodeGitWorktrees.worktrees.dir.path") ?? null;

import {
    addNewWorktree,
    addRemoteWorktree,
    existsWorktree,
} from "../../../helpers/gitWorktreeHelpers";
import { OPEN_ISSUE_URL } from "../../../constants/constants";
import {
    fetch,
    selectBranch,
    isGitRepository,
    getRemoteBranches,
    removeLocalBranchesThatDoNotExistOnRemoteRepository,
} from "../../../helpers/gitHelpers";
import {
    copyToClipboard,
    openBrowser,
    shouldRemoveStalledBranches,
} from "../../../helpers/helpers";
import {
    getUserInput,
    showErrorMessageWithButton,
    showInformationMessage,
} from "../../../helpers/vsCodeHelpers";

const gitWorktreeAdd = async (): Promise<void> => {
    try {
        const isGitRepo = await isGitRepository();
        if (!isGitRepo) throw new Error("This is not a git repository.");

        showInformationMessage("Calculating remote branches to suggest you...");

        await fetch();

        if (shouldRemoveStalledBranches) {
            await removeLocalBranchesThatDoNotExistOnRemoteRepository();
        }

        const remoteBranches = await getRemoteBranches();
        const remoteBranch = await selectBranch(remoteBranches);
        if (!remoteBranch) return;

        let newBranch = await getUserInput("New branch", "Type the name of the new branch");

        // if the user didn't select a branch, we assign the remote branch as the new branch
        if (!newBranch) {
            newBranch = remoteBranch;
        }

        const isWorktree = await existsWorktree(newBranch);
        if (isWorktree) throw new Error(`Worktree '${newBranch}' already exists.`);

        showInformationMessage(`Creating new Worktree named '${newBranch}'...`);

        const isSameBranch = remoteBranch === newBranch;

        if (isSameBranch) {
            await addRemoteWorktree(remoteBranch, newBranch);
        } else {
            await addNewWorktree(remoteBranch, newBranch);
        }
    } catch (e: any) {
        const errorMessage = e.message;
        const buttonName = "Open an Issue";
        // const buttonName = "Copy Error and Open an Issue";
        const answer = await showErrorMessageWithButton({ errorMessage, buttonName });

        if (answer !== buttonName) return;

        // await copyToClipboard(errorMessage);
        await openBrowser(OPEN_ISSUE_URL);
    }
};

export default gitWorktreeAdd;

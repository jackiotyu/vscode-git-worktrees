import { calculateNewWorktreePath } from "../../../helpers/gitWorktreeHelpers";
import { OPEN_ISSUE_URL } from "../../../constants/constants";
import { isGitRepository, getRemoteBranches, selectBranch } from "../../../helpers/gitHelpers";
import { copyToClipboard, openBrowser } from "../../../helpers/helpers";
import { getUserInput, showErrorMessageWithButton } from "../../../helpers/vsCodeHelpers";

const gitWorktreeAdd = async (): Promise<void> => {
    try {
        const isGitRepo = await isGitRepository();
        if (!isGitRepo) throw new Error("This is not a git repository.");

        const newWorktreePath = await calculateNewWorktreePath();

        const remoteBranches = await getRemoteBranches();

        const remoteBranch = await selectBranch(remoteBranches);

        if (!remoteBranch) return;

        const newBranch = await getUserInput("New branch", "Type the name of the new branch");

        if (!newBranch) return;

        const foundBranch = remoteBranches.find((branch) => branch === newBranch);

        if (foundBranch) throw new Error(`Branch '${newBranch}' already exists.`);
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

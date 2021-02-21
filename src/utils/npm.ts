import * as utils from "./actionUtils";

export async function prepareCleanup(): Promise<void> {
    console.log("Prepare for cleanup of NPM cache..")
}

export async function performCleanup(): Promise<void> {
    console.log("Perform NPM cache cleanup..")

    try {
        const showOutput = await utils.runCommand("npm", ["prune"]);
        const show = showOutput.standardOutAsString()
        console.log(show);
    } catch (err) {
        console.error(err);
    }
}

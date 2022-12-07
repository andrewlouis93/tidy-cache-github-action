import * as io from "@actions/io";
import * as fs from 'fs'
import * as os from 'os'
import * as constants from './constants';
import * as core from "@actions/core";

import { GradleRepositoryPath, GradleWrapperPath, GradleWrapperPropertiesPathSuffix } from "./constants";

import * as utils from "./actionUtils";


function ensureGradleDirectoryExists() : string {
    const directory = utils.toAbsolutePath(GradleRepositoryPath);
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }
    return directory
}

export async function prepareCleanup(): Promise<void> {
    console.log("Prepare for cleanup of Gradle cache..")
    core.saveState("gradle-timestamp", Date.now());

    const homedir = os.homedir();
    const gradleDirectory = ensureGradleDirectoryExists()
    const path = gradleDirectory + "/cleaner-1.0.0.jar";
    if (!fs.existsSync(path)) {
        await utils.downloadCacheHttpClient('https://repo1.maven.org/maven2/com/github/skjolber/gradle-cache-cleaner/core/1.0.0/core-1.0.0.jar', path);
    }
    if (!fs.existsSync(path)) {
        console.log("Unable to prepare cleanup");
    } else {
        console.log("Prepared for Gradle cleanup");
    }
}

export async function performCleanup(): Promise<void> {
    var timestamp = core.getState("gradle-timestamp");
    const projectRoot = core.getInput(constants.INPUT_PROJECT_ROOT) || "." + "/";
    const gradlePropertiesPath = `${projectRoot}${GradleWrapperPropertiesPathSuffix}`;

    try {
        // read contents of the file
        const data = fs.readFileSync(gradlePropertiesPath, 'UTF-8');

        // split the contents by new line
        const lines = data.split(/\r?\n/);

        var gradleVersion;
        // print all lines
        lines.forEach((line) => {
            if(line.startsWith("distributionUrl=")) {
                const index = line.lastIndexOf("/");
                if(index != -1) {
                    const endIndex = line.lastIndexOf(".");
                    if(endIndex != -1) {
                        gradleVersion = line.substring(index + 1, endIndex);
                    }
                }
            }
        });

        if(gradleVersion) {
            var classpath;
            const file0 = utils.toAbsolutePath(GradleWrapperPath + "/dists/" + gradleVersion);
            if(fs.existsSync(file0)) {
                fs.readdirSync(file0).forEach(file1 => {
                    const gradleVersionDirectory = file0 + "/" + file1;
                    if(fs.existsSync(gradleVersionDirectory)) {
                        fs.readdirSync(gradleVersionDirectory).forEach(file2 => {
                            const gradleUnpackedDirectory = gradleVersionDirectory + "/" + file2;
                            if(fs.lstatSync(gradleUnpackedDirectory).isDirectory()) {
                                if(file2.startsWith("gradle-")) {
                                    const file3 = gradleUnpackedDirectory + "/lib";
                                    if(fs.existsSync(file3)) {
                                        classpath = file3;
                                    }
                                }
                            }
                        });
                    }
              });
            }
            if(classpath) {
                console.log("Found classpath " + classpath);

                const stop = await utils.runCommand(`${projectRoot}/gradlew`, ["--stop"]);

                const gradleDirectory = ensureGradleDirectoryExists()
                const path = gradleDirectory + "/cleaner-1.0.0.jar";

                const showOutput = await utils.runJavaCommand(["-cp", path + ":" + classpath + "/*", "com.github.skjolber.gradle.Runner", timestamp]);
                const show = showOutput.standardOutAsString()
            } else {
                console.log("Classpath not found");
            }
        } else {
            console.log("Unable to detect gradle wrapper version")
        }

    } catch (err) {
        console.error(err);
    }
}

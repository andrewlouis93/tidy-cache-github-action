import * as cache from "@actions/cache";
import * as glob from '@actions/glob'
import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as io from "@actions/io";
import * as fs from 'fs'
import * as util from 'util'
import * as os from 'os'
import * as path from 'path'

import {M2Path, M2RepositoryPath} from "./constants";

import * as utils from "./actionUtils";

function ensureMavenDirectoryExists() : string {
    const mavenDirectory = utils.toAbsolutePath(M2RepositoryPath);
    if (!fs.existsSync(mavenDirectory)) {
        fs.mkdirSync(mavenDirectory, { recursive: true });
    }
    return mavenDirectory
}

export async function prepareCleanup(): Promise<void> {
    console.log("Prepare for cleanup of Maven cache..")
    const homedir = os.homedir();

    const mavenDirectory = ensureMavenDirectoryExists()

    const path = mavenDirectory + "/agent-1.0.0.jar";
    if (!fs.existsSync(path)) {
        await utils.downloadCacheHttpClient('https://repo1.maven.org/maven2/com/github/skjolber/maven-pom-recorder/agent/1.0.0/agent-1.0.0.jar', path);
    }
    if (fs.existsSync(path)) {
        const mavenrc  = os.homedir() + "/.mavenrc";
        var command = `export MAVEN_OPTS=\"$MAVEN_OPTS -javaagent:${path}\"\n`
        fs.appendFileSync(mavenrc, command);
    } else {
        console.log("Unable to prepare cleanup");
    }
}

async function findPoms(paths: Array<string>) : Promise<Set<string>> {
  let buildFiles = new Set<string>();

  for (var path of paths) {
    const globber = await glob.create(paths + "/**/*.pom", {followSymbolicLinks : false})
    for await (const file of globber.globGenerator()) {
        buildFiles.add(file);
    }
  }
  return buildFiles;
}

export async function performCleanup(): Promise<void> {

  let pomsInUse = new Set<string>();

  var m2 = utils.toAbsolutePath(M2Path);
  fs.readdirSync(utils.toAbsolutePath(M2Path)).forEach(file => {
      const fileName = path.basename(file);
      if(fileName.startsWith("maven-pom-recorder-poms-") && fileName.endsWith(".txt")) {
          console.log("Read file " + file);
          var poms = fs.readFileSync(m2 + "/" + file,
                      {encoding:'utf8', flag:'r'})
                  .split("\n")
                  .map(s => s.trim())
                  .filter(x => x !== "")

          poms.forEach(item => pomsInUse.add(item))
      }
  });

  if (pomsInUse.size > 0) {
    console.log("Perform cleanup of Maven cache..")

    var poms = await findPoms([M2RepositoryPath]);

    console.log("Found " + poms.size + " cached artifacts, of which " + pomsInUse.size + " are in use");

    for(var pom of pomsInUse) {
        poms.delete(pom);
    }

    console.log("Delete " + poms.size + " cached artifacts which are no longer in use.");

    for(var pom of poms) {
        var parent = path.dirname(pom);
        console.log("Delete directory " + parent);
        if (!fs.existsSync(parent)) {
            console.log("Parent does not exist")
        }

        fs.rmdirSync(parent, { recursive: true });

        if (fs.existsSync(parent)) {
            console.log("Parent exists")
        }
    }
  } else {
      console.log("Cache cleanup not necessary.")
  }


}

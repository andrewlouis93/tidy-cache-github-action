import * as io from "@actions/io";
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

import * as core from "@actions/core";

import { M2Path, M2RepositoryPath, GradleRepositoryPath, GradleWrapperPath, GradleWrapperPropertiesPath, NpmPath } from "./constants";

import * as utils from "./actionUtils";
import * as maven from "./maven";
import * as gradle from "./gradle";
import * as npm from "./npm";

export interface CacheDetector {

  getName() : string;

  detect(): boolean;

  prepare() : Promise<void>;

  perform() : Promise<void>;
}

export class MavenCacheDetector implements CacheDetector {

    getName() {
        return "maven";
    }

    detect() {
        return fs.existsSync(utils.toAbsolutePath(M2RepositoryPath));
    }

    async prepare() {
        console.log("Prepare Maven cache cleanup");
        return maven.prepareCleanup();
    }

    async perform() {
        console.log("Clean up Maven cache");
        return maven.performCleanup();
    }
}

export class GradleCacheDetector implements CacheDetector {

    getName() {
        return "gradle";
    }

    detect() {
        return fs.existsSync(utils.toAbsolutePath(GradleRepositoryPath));
    }

    async prepare() {
        console.log("Prepare Gradle cache cleanup");
        return gradle.prepareCleanup();
    }

    async perform() {
        console.log("Clean up Gradle artifacts");
        return gradle.performCleanup();
    }
}

export class NpmCacheDetector implements CacheDetector {

    getName() {
        return "npm";
    }

    detect() {
        return fs.existsSync(utils.toAbsolutePath(NpmPath));
    }

    async prepare() {
        console.log("Prepare NPM cache cleanup");
        return npm.prepareCleanup();
    }

    async perform() {
        console.log("Clean up NPM");
        return npm.performCleanup();
    }
}

import * as core from "@actions/core";
import * as d from "./utils/detector";

async function run(): Promise<void> {
    try {
        let detectors = new Array<d.CacheDetector>();

        detectors.push(new d.MavenCacheDetector());
        detectors.push(new d.GradleCacheDetector());
        detectors.push(new d.NpmCacheDetector());

        var promises = new Array<Promise<void>>();
        for (var detector of detectors) {
            if(detector.detect()) {
                console.log(detector.getName() + " detected");

                core.saveState(detector.getName(), true);
                promises.push(detector.prepare());
            } else {
                console.log(detector.getName() + " not detected");
            }
        }
        await Promise.all(promises);
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();

export default run;

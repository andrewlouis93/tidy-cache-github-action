import * as core from "@actions/core";
import * as d from "./utils/detector";
import * as utils from "./utils/actionUtils";

async function run(): Promise<void> {
    try {

      let detectors = new Array<d.CacheDetector>();

      detectors.push(new d.MavenCacheDetector());
      detectors.push(new d.GradleCacheDetector());
      detectors.push(new d.NpmCacheDetector());

      var promises = new Array<Promise<void>>();
      for (var detector of detectors) {
          const state = core.getState(detector.getName());
          if(state) {
              promises.push(detector.perform());
          }
      }
      await Promise.all(promises);
    } catch (error) {
        utils.logWarning(error.message);
    }
}

run();

export default run;

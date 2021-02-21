# tidy-cache-github-action
This [Github Action](https://docs.github.com/en/actions) adds support for __removing unused dependencies from build caches__.

In a nutshell, spend some time to clean up the cache, spend less time on cache restore and save. Note that Github deletes caches after a week, so this action is best suited for project under constant development, i.e. over time accumulating a lot of outdated dependencies from previous builds.

Supported build systems:

 * Maven
 * Gradle
 * NPM

## Usage
Run the `skjolber/tidy-cache-github-action` action after the cache restore step, and only whenever the cache will be saved again (i.e. when `actions/cache` is not able to restore its primary key). 

Maven example:
```
    steps:
      - name: Checkout
        uses: actions/checkout@v2
      - name: Cache local Maven repository
        uses: actions/cache@v2
        id: maven-cache
        with:
          path: ~/.m2/repository
          key: ${{ runner.os }}-maven-v1-${{ hashFiles('**/pom.xml') }}
          restore-keys: |
            ${{ runner.os }}-maven-v1-
      - name: Remove unused dependencies
        uses: skjolber/tidy-cache-github-action@v1
        if: steps.maven-cache.outputs.cache-hit != 'true'
      - name: Your build here
        run: mvn verify
```

The action autodetects which cleanups to run by checking for the existence of cache folders (and runs them in parallel).

## Details
While NPM has a built-in command for removing unused depenencies, for Maven and Gradle, things are not that simple:

 * Maven: Adds [instrumentation](https://github.com/skjolber/maven-pom-recorder) via the `.mavnrc` file, so to record which pom files are in use.
 * Gradle: [Accesses the cache journal](https://github.com/skjolber/gradle-cache-cleaner). Uses internal classes. 

So there is some risk that the cleanup logic will fail at some point in the future.

## License
The scripts and documentation in this project are released under the [MIT License](LICENSE)

## See Also
 * Github [Cache Action](https://github.com/actions/cache)
 * [maven-pom-recorder](https://github.com/skjolber/maven-pom-recorder)
 * [gradle-cache-cleaner](https://github.com/skjolber/gradle-cache-cleaner)


// The default number of retry attempts.
export const DefaultRetryAttempts = 2

// The default delay in milliseconds between retry attempts.
export const DefaultRetryDelay = 5000

// Socket timeout in milliseconds during download.  If no traffic is received
// over the socket during this period, the socket is destroyed and the download
// is aborted.
export const SocketTimeout = 5000

export const NpmPath = "~/.npm"

export const M2Path = "~/.m2"
export const M2RepositoryPath = "~/.m2/repository"

export const GradlePath = "~/.gradle"
export const GradleRepositoryPath = "~/.gradle/caches"
export const GradleWrapperPath = "~/.gradle/wrapper"
export const GradleWrapperPropertiesPathSuffix = "/gradle/wrapper/gradle-wrapper.properties"

export const INPUT_PROJECT_ROOT = 'project-root';

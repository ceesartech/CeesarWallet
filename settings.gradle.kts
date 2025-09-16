plugins {
    id("org.gradle.toolchains.foojay-resolver-convention") version "0.8.0"
}
rootProject.name = "algorithmic-trading-platform"

include("core")
include("backend")
include("frontend")
include("ml-algorithm")
include("fraud-pipeline")
include("infra")
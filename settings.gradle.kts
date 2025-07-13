plugins {
    id("org.gradle.toolchains.foojay-resolver-convention") version "0.8.0"
}
rootProject.name = "CeesarWallet"

include("core")
include("backend")
include("frontend")
include("ml-algorithm")
include("infra")
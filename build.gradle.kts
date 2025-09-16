plugins {
    kotlin("jvm") version "1.9.0" apply false
    kotlin("multiplatform") version "1.9.0" apply false
    kotlin("plugin.serialization") version "1.9.0" apply false
    id("com.github.johnrengelman.shadow") version "8.1.1" apply false
    id("org.jetbrains.kotlinx.kover") version "0.7.4" apply false
}

allprojects {
    repositories {
        mavenCentral()
        gradlePluginPortal()
    }
}

subprojects {
    group = "tech.ceesar.ceesarwallet"
    version = "0.1.0"
    
    tasks.withType<Test> {
        useJUnitPlatform()
    }
}
plugins {
    kotlin("jvm") version "1.9.0" apply false
}

allprojects {
    repositories {
        mavenCentral()
    }
}

subprojects {
    apply(plugin = "org.jetbrains.kotlin.jvm")
    group = "tech.ceesar.ceesarwallet"
    version = "0.1.0"
    dependencies {
        add("implementation", kotlin("stdlib"))
        add("testImplementation", kotlin("test"))
    }
    tasks.withType<Test> {
        useJUnitPlatform()
    }
}
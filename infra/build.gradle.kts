plugins {
    kotlin("jvm")
    id("com.github.johnrengelman.shadow")
    id("org.jetbrains.kotlinx.kover")
}

dependencies {
    implementation("software.amazon.awscdk:aws-cdk-lib:2.100.0")
    implementation("software.constructs:constructs:10.3.0")
    
    implementation("org.jetbrains.kotlin:kotlin-stdlib")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.0")
    implementation("org.jetbrains.kotlinx:kotlinx-datetime:0.5.0")
    
    implementation("io.ktor:ktor-client-core:2.3.7")
    implementation("io.ktor:ktor-client-content-negotiation:2.3.7")
    implementation("io.ktor:ktor-serialization-kotlinx-json:2.3.7")
    implementation("io.ktor:ktor-client-logging:2.3.7")
    
    implementation("org.slf4j:slf4j-api:2.0.9")
    implementation("ch.qos.logback:logback-classic:1.4.14")
    
    testImplementation("org.jetbrains.kotlin:kotlin-test")
    testImplementation("org.junit.jupiter:junit-jupiter:5.10.1")
    testImplementation("org.mockito:mockito-core:5.7.0")
    testImplementation("org.mockito.kotlin:mockito-kotlin:5.2.1")
}

tasks.test {
    useJUnitPlatform()
}

tasks.shadowJar {
    archiveBaseName.set("ceesar-wallet-infra")
    archiveVersion.set("1.0.0")
    archiveClassifier.set("")
    
    manifest {
        attributes(mapOf("Main-Class" to "tech.ceesar.ceesarwallet.infra.CeesarWalletStackKt"))
    }
}
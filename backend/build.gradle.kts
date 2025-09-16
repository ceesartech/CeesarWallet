plugins {
    kotlin("jvm")
    kotlin("plugin.serialization")
    id("com.github.johnrengelman.shadow")
    application
}

dependencies {
    implementation(project(":core"))
    
    // Ktor
    implementation("io.ktor:ktor-server-core:2.3.5")
    implementation("io.ktor:ktor-server-netty:2.3.5")
    implementation("io.ktor:ktor-server-content-negotiation:2.3.5")
    implementation("io.ktor:ktor-serialization-kotlinx-json:2.3.5")
    implementation("io.ktor:ktor-server-cors:2.3.5")
    implementation("io.ktor:ktor-server-auth:2.3.5")
    implementation("io.ktor:ktor-server-auth-jwt:2.3.5")
    implementation("io.ktor:ktor-server-websockets:2.3.5")
    implementation("io.ktor:ktor-client-core:2.3.5")
    implementation("io.ktor:ktor-client-cio:2.3.5")
    implementation("io.ktor:ktor-client-content-negotiation:2.3.5")
    implementation("io.ktor:ktor-client-logging:2.3.5")
    
    // AWS SDK
    implementation("software.amazon.awssdk:kinesis:2.21.29")
    implementation("software.amazon.awssdk:dynamodb:2.21.29")
    implementation("software.amazon.awssdk:frauddetector:2.21.29")
    implementation("software.amazon.awssdk:cognitoidentityprovider:2.21.29")
    implementation("software.amazon.awssdk:secretsmanager:2.21.29")
    implementation("software.amazon.awssdk:ssm:2.21.29")
    
    // Redis
    implementation("redis.clients:jedis:5.0.2")
    
    // Logging
    implementation("ch.qos.logback:logback-classic:1.4.11")
    implementation("io.github.microutils:kotlin-logging:3.0.5")
    
    // Serialization
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.0")
    implementation("org.jetbrains.kotlinx:kotlinx-datetime:0.4.1")
    
    // Testing
    testImplementation(kotlin("test"))
    testImplementation("io.ktor:ktor-server-test-host:2.3.5")
    testImplementation("org.junit.jupiter:junit-jupiter:5.10.0")
    testImplementation("io.mockk:mockk:1.13.8")
}

application {
    mainClass.set("tech.ceesar.ceesarwallet.backend.ApplicationKt")
}
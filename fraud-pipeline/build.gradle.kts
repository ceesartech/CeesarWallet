plugins {
    kotlin("jvm") version "1.9.0"
    kotlin("plugin.serialization") version "1.9.0"
}

dependencies {
    implementation(kotlin("stdlib"))
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.0")
    implementation("com.amazonaws:aws-java-sdk-kinesis:1.12.565")
    implementation("com.amazonaws:aws-java-sdk-frauddetector:1.12.565")
    implementation("org.apache.flink:flink-streaming-java:1.18.0")
    implementation("org.apache.flink:flink-connector-kinesis:4.0.0-1.18")
    implementation("org.apache.flink:flink-clients:1.18.0")
    
    testImplementation(kotlin("test"))
    testImplementation("org.junit.jupiter:junit-jupiter:5.10.0")
}

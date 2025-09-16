name := "fraud-detection-flink"

version := "1.0"

scalaVersion := "2.12.15"

val flinkVersion = "1.18.0"
val awsSdkVersion = "2.21.29"

libraryDependencies ++= Seq(
  "org.apache.flink" %% "flink-streaming-scala" % flinkVersion,
  "org.apache.flink" %% "flink-clients" % flinkVersion,
  "org.apache.flink" %% "flink-connector-kinesis" % "4.0.0-1.18",
  "org.apache.flink" %% "flink-connector-kinesis-streams" % "4.0.0-1.18",
  
  "software.amazon.awssdk" % "frauddetector" % awsSdkVersion,
  "software.amazon.awssdk" % "kinesis" % awsSdkVersion,
  
  "com.fasterxml.jackson.core" % "jackson-databind" % "2.15.2",
  "com.fasterxml.jackson.module" %% "jackson-module-scala" % "2.15.2",
  
  "org.scalatest" %% "scalatest" % "3.2.15" % Test,
  "org.apache.flink" %% "flink-test-utils" % flinkVersion % Test,
  "org.apache.flink" %% "flink-streaming-java" % flinkVersion % Test
)

assembly / assemblyMergeStrategy := {
  case PathList("META-INF", xs @ _*) => MergeStrategy.discard
  case x => MergeStrategy.first
}

assembly / assemblyJarName := "fraud-detection-flink.jar"

// Exclude Scala from the JAR since it will be provided by Flink
assembly / assemblyOption := (assembly / assemblyOption).value.copy(includeScala = false)

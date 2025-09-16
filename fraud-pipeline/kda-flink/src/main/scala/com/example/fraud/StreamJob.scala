package com.example.fraud

import org.apache.flink.api.common.functions.MapFunction
import org.apache.flink.api.common.serialization.SimpleStringSchema
import org.apache.flink.api.common.state.{ValueState, ValueStateDescriptor}
import org.apache.flink.api.common.typeinfo.TypeInformation
import org.apache.flink.configuration.Configuration
import org.apache.flink.streaming.api.functions.KeyedProcessFunction
import org.apache.flink.streaming.api.scala._
import org.apache.flink.streaming.connectors.kinesis.FlinkKinesisConsumer
import org.apache.flink.streaming.connectors.kinesis.config.ConsumerConfigConstants
import org.apache.flink.util.Collector
import org.apache.flink.api.common.state.MapStateDescriptor
import org.apache.flink.api.common.state.BroadcastState
import org.apache.flink.streaming.api.functions.co.BroadcastProcessFunction
import org.apache.flink.api.common.typeinfo.BasicTypeInfo
import org.apache.flink.api.common.typeinfo.TypeInformation

import java.time.{Instant, Duration}
import java.util.Properties
import scala.collection.mutable
import scala.util.{Try, Success, Failure}
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.scala.DefaultScalaModule
import software.amazon.awssdk.services.frauddetector.FraudDetectorClient
import software.amazon.awssdk.services.frauddetector.model._

/**
 * Flink streaming job for real-time fraud detection
 */
object StreamJob {
  
  case class FraudEvent(
    eventId: String,
    userId: String,
    eventType: String,
    timestamp: String,
    ip: Option[String] = None,
    deviceId: Option[String] = None,
    geo: Option[String] = None,
    symbol: Option[String] = None,
    assetClass: Option[String] = None,
    qty: Option[String] = None,
    notional: Option[String] = None,
    executionPrice: Option[String] = None,
    fees: Option[String] = None,
    authType: Option[String] = None,
    success: Option[Boolean] = None,
    amount: Option[String] = None,
    currency: Option[String] = None,
    paymentMethod: Option[String] = None
  )
  
  case class FraudScore(
    eventId: String,
    userId: String,
    score: Double,
    action: String,
    explanations: List[String] = List.empty,
    modelVersion: Option[String] = None,
    timestamp: String
  )
  
  case class VelocityState(
    userId: String,
    ip: String,
    deviceId: String,
    geo: String,
    symbol: String,
    assetClass: String,
    lastUpdate: Long,
    counts: Map[String, Int]
  )
  
  class VelocityCalculator extends KeyedProcessFunction[String, FraudEvent, FraudEvent] {
    
    private var velocityState: ValueState[VelocityState] = _
    private val objectMapper = new ObjectMapper()
    objectMapper.registerModule(DefaultScalaModule)
    
    override def open(parameters: Configuration): Unit = {
      val velocityStateDescriptor = new ValueStateDescriptor[VelocityState](
        "velocity-state",
        TypeInformation.of(classOf[VelocityState])
      )
      velocityState = getRuntimeContext.getState(velocityStateDescriptor)
    }
    
    override def processElement(
      event: FraudEvent,
      ctx: KeyedProcessFunction[String, FraudEvent, FraudEvent]#Context,
      out: Collector[FraudEvent]
    ): Unit = {
      
      val currentTime = Instant.now().toEpochMilli
      val currentState = Option(velocityState.value()).getOrElse(
        VelocityState(
          userId = event.userId,
          ip = event.ip.getOrElse(""),
          deviceId = event.deviceId.getOrElse(""),
          geo = event.geo.getOrElse(""),
          symbol = event.symbol.getOrElse(""),
          assetClass = event.assetClass.getOrElse(""),
          lastUpdate = currentTime,
          counts = Map.empty
        )
      )
      
      // Update velocity counts for different time windows
      val updatedCounts = updateVelocityCounts(currentState.counts, currentTime)
      
      val updatedState = currentState.copy(
        lastUpdate = currentTime,
        counts = updatedCounts
      )
      
      velocityState.update(updatedState)
      
      // Add velocity features to event
      val enrichedEvent = enrichEventWithVelocity(event, updatedCounts)
      
      out.collect(enrichedEvent)
    }
    
    private def updateVelocityCounts(
      counts: Map[String, Int],
      currentTime: Long
    ): Map[String, Int] = {
      
      val timeWindows = List("1m", "5m", "15m", "1h", "1d")
      val updatedCounts = mutable.Map(counts.toSeq: _*)
      
      // Clean up expired counts
      val expiredKeys = updatedCounts.keys.filter { key =>
        val parts = key.split("_")
        if (parts.length >= 2) {
          val window = parts(1)
          val timestamp = Try(parts(2).toLong).getOrElse(0L)
          val windowMs = getWindowMs(window)
          currentTime - timestamp > windowMs
        } else {
          false
        }
      }
      
      expiredKeys.foreach(updatedCounts.remove)
      
      // Increment counts for current time
      timeWindows.foreach { window =>
        val key = s"count_${window}_${currentTime}"
        updatedCounts(key) = updatedCounts.getOrElse(key, 0) + 1
      }
      
      updatedCounts.toMap
    }
    
    private def getWindowMs(window: String): Long = {
      window match {
        case "1m" => 60 * 1000L
        case "5m" => 5 * 60 * 1000L
        case "15m" => 15 * 60 * 1000L
        case "1h" => 60 * 60 * 1000L
        case "1d" => 24 * 60 * 60 * 1000L
        case _ => 60 * 1000L
      }
    }
    
    private def enrichEventWithVelocity(
      event: FraudEvent,
      counts: Map[String, Int]
    ): FraudEvent = {
      
      // Calculate velocity features
      val userVelocity1m = counts.filter(_._1.contains("1m")).values.sum
      val userVelocity1h = counts.filter(_._1.contains("1h")).values.sum
      val userVelocity1d = counts.filter(_._1.contains("1d")).values.sum
      
      // Add velocity metadata to event
      event.copy(
        // This would be extended to include velocity features
        // For now, we'll pass the original event
      )
    }
  }
  
  class FraudDetectorProcessor extends KeyedProcessFunction[String, FraudEvent, FraudScore] {
    
    private var fraudDetectorClient: FraudDetectorClient = _
    private val objectMapper = new ObjectMapper()
    objectMapper.registerModule(DefaultScalaModule)
    
    override def open(parameters: Configuration): Unit = {
      fraudDetectorClient = FraudDetectorClient.builder().build()
    }
    
    override def processElement(
      event: FraudEvent,
      ctx: KeyedProcessFunction[String, FraudEvent, FraudScore]#Context,
      out: Collector[FraudScore]
    ): Unit = {
      
      try {
        val detectorId = getDetectorId(event.eventType)
        val eventTypeName = getEventTypeName(event.eventType)
        
        // Build event variables for AWS Fraud Detector
        val eventVariables = buildEventVariables(event)
        
        // Create prediction request
        val predictionRequest = GetEventPredictionRequest.builder()
          .detectorId(detectorId)
          .eventId(event.eventId)
          .eventTypeName(eventTypeName)
          .eventTimestamp(Instant.parse(event.timestamp))
          .entities(Map("userId" -> Entity.builder()
            .entityType("userId")
            .entityId(event.userId)
            .build()))
          .eventVariables(eventVariables)
          .build()
        
        // Get prediction from AWS Fraud Detector
        val predictionResponse = fraudDetectorClient.getEventPrediction(predictionRequest)
        
        // Extract score and outcome
        val score = predictionResponse.modelScores().values().asScala.headOption.getOrElse(0.0)
        val outcome = predictionResponse.outcomes().asScala.headOption.getOrElse("ALLOW")
        
        // Generate explanations
        val explanations = generateExplanations(event, score, outcome)
        
        // Create fraud score event
        val fraudScore = FraudScore(
          eventId = event.eventId,
          userId = event.userId,
          score = score,
          action = outcome,
          explanations = explanations,
          modelVersion = Option(predictionResponse.modelScores().keys().asScala.headOption.orNull),
          timestamp = Instant.now().toString
        )
        
        out.collect(fraudScore)
        
      } catch {
        case e: Exception =>
          // Log error and emit safe default
          println(s"Fraud detection error for event ${event.eventId}: ${e.getMessage}")
          
          val safeScore = FraudScore(
            eventId = event.eventId,
            userId = event.userId,
            score = 0.5,
            action = "ALLOW",
            explanations = List("fraud-detection-error"),
            timestamp = Instant.now().toString
          )
          
          out.collect(safeScore)
      }
    }
    
    private def getDetectorId(eventType: String): String = {
      eventType match {
        case "PRE_TRADE" => "pre-trade-detector"
        case "AUTH" => "auth-detector"
        case "PAYMENT" => "payment-detector"
        case _ => "pre-trade-detector"
      }
    }
    
    private def getEventTypeName(eventType: String): String = {
      eventType match {
        case "PRE_TRADE" => "pre_trade"
        case "AUTH" => "auth"
        case "PAYMENT" => "payment"
        case _ => "pre_trade"
      }
    }
    
    private def buildEventVariables(event: FraudEvent): Map[String, String] = {
      val variables = mutable.Map[String, String]()
      
      event.ip.foreach(variables("ip") = _)
      event.deviceId.foreach(variables("deviceId") = _)
      event.geo.foreach(variables("geo") = _)
      event.symbol.foreach(variables("symbol") = _)
      event.assetClass.foreach(variables("assetClass") = _)
      event.qty.foreach(variables("quantity") = _)
      event.notional.foreach(variables("notional") = _)
      event.authType.foreach(variables("authType") = _)
      event.success.foreach(variables("success") = _.toString)
      event.amount.foreach(variables("amount") = _)
      event.currency.foreach(variables("currency") = _)
      event.paymentMethod.foreach(variables("paymentMethod") = _)
      
      // Add computed velocity features
      variables("userVelocity1m") = "0" // Would be calculated from state
      variables("ipVelocity1m") = "0"
      variables("deviceVelocity1m") = "0"
      variables("geoVelocity1m") = "0"
      
      variables.toMap
    }
    
    private def generateExplanations(
      event: FraudEvent,
      score: Double,
      outcome: String
    ): List[String] = {
      
      val explanations = mutable.ListBuffer[String]()
      
      // Score-based explanations
      if (score < 0.1) {
        explanations += "low-risk-score"
      } else if (score < 0.3) {
        explanations += "medium-risk-score"
      } else {
        explanations += "high-risk-score"
      }
      
      // Outcome-based explanations
      outcome match {
        case "ALLOW" => explanations += "transaction-approved"
        case "BLOCK" => explanations += "transaction-blocked"
        case "MFA" => explanations += "mfa-required"
        case "SHADOW" => explanations += "shadow-mode"
      }
      
      // Event-specific explanations
      event.eventType match {
        case "PRE_TRADE" =>
          if (event.notional.exists(_.toDoubleOption.exists(_ > 10000))) {
            explanations += "large-transaction"
          }
        case "AUTH" =>
          if (event.success.contains(false)) {
            explanations += "failed-authentication"
          }
        case "PAYMENT" =>
          if (event.amount.exists(_.toDoubleOption.exists(_ > 1000))) {
            explanations += "large-payment"
          }
      }
      
      explanations.toList
    }
    
    override def close(): Unit = {
      if (fraudDetectorClient != null) {
        fraudDetectorClient.close()
      }
    }
  }
  
  def main(args: Array[String]): Unit = {
    
    val env = StreamExecutionEnvironment.getExecutionEnvironment
    
    // Configure Kinesis consumer properties
    val kinesisConsumerConfig = new Properties()
    kinesisConsumerConfig.setProperty(ConsumerConfigConstants.AWS_REGION, "us-east-1")
    kinesisConsumerConfig.setProperty(ConsumerConfigConstants.STREAM_INITIAL_POSITION, "LATEST")
    
    // Create Kinesis consumer for raw events
    val rawEventsConsumer = new FlinkKinesisConsumer[String](
      "events-raw",
      new SimpleStringSchema(),
      kinesisConsumerConfig
    )
    
    // Parse events and calculate velocity
    val rawEventsStream = env
      .addSource(rawEventsConsumer)
      .map(new MapFunction[String, FraudEvent] {
        override def map(value: String): FraudEvent = {
          try {
            val objectMapper = new ObjectMapper()
            objectMapper.registerModule(DefaultScalaModule)
            objectMapper.readValue(value, classOf[FraudEvent])
          } catch {
            case e: Exception =>
              println(s"Error parsing event: ${e.getMessage}")
              null
          }
        }
      })
      .filter(_ != null)
      .keyBy(_.userId)
      .process(new VelocityCalculator)
    
    // Process events for fraud detection
    val fraudScoresStream = rawEventsStream
      .keyBy(_.userId)
      .process(new FraudDetectorProcessor)
    
    // Convert fraud scores to JSON and send to output stream
    val fraudScoresJsonStream = fraudScoresStream
      .map(new MapFunction[FraudScore, String] {
        override def map(score: FraudScore): String = {
          val objectMapper = new ObjectMapper()
          objectMapper.registerModule(DefaultScalaModule)
          objectMapper.writeValueAsString(score)
        }
      })
    
    // Create Kinesis producer for scored events
    val scoredEventsProducer = new FlinkKinesisProducer[String](
      new SimpleStringSchema(),
      kinesisConsumerConfig
    )
    scoredEventsProducer.setDefaultStream("events-scored")
    scoredEventsProducer.setDefaultPartition("0")
    
    // Send fraud scores to output stream
    fraudScoresJsonStream.addSink(scoredEventsProducer)
    
    // Execute the job
    env.execute("Fraud Detection Stream Job")
  }
}

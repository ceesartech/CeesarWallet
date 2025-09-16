package tech.ceesar.ceesarwallet.backend.auth

import kotlinx.serialization.Serializable
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient
import software.amazon.awssdk.services.cognitoidentityprovider.model.*
import mu.KotlinLogging

private val logger = KotlinLogging.logger {}

class AuthenticationException(message: String, val code: String? = null) : Exception(message)
class ValidationException(message: String) : Exception(message)

@Serializable
data class LoginRequest(
    val username: String,
    val password: String
)

@Serializable
data class LoginResponse(
    val accessToken: String,
    val refreshToken: String,
    val expiresIn: Int,
    val tokenType: String = "Bearer"
)

@Serializable
data class RegisterRequest(
    val username: String,
    val password: String,
    val email: String,
    val firstName: String,
    val lastName: String
)

@Serializable
data class RegisterResponse(
    val userId: String,
    val message: String
)

interface AuthService {
    suspend fun login(request: LoginRequest): LoginResponse
    suspend fun register(request: RegisterRequest): RegisterResponse
    suspend fun refreshToken(refreshToken: String): LoginResponse
    suspend fun logout(accessToken: String)
    suspend fun verifyToken(token: String): Boolean
}

class CognitoAuthService(
    private val cognitoClient: CognitoIdentityProviderClient,
    private val userPoolId: String,
    private val clientId: String,
    private val clientSecret: String? = null
) : AuthService {
    
    override suspend fun login(request: LoginRequest): LoginResponse {
        try {
            // Prepare authentication parameters
            val authParams = mutableMapOf(
                "USERNAME" to request.username,
                "PASSWORD" to request.password
            )
            
            // Add client secret if configured
            if (clientSecret != null) {
                val secretHash = calculateSecretHash(request.username, clientId, clientSecret)
                authParams["SECRET_HASH"] = secretHash
            }
            
            val authRequest = AdminInitiateAuthRequest.builder()
                .userPoolId(userPoolId)
                .clientId(clientId)
                .authFlow(AuthFlowType.ADMIN_NO_SRP_AUTH)
                .authParameters(authParams)
                .build()
            
            val authResponse = cognitoClient.adminInitiateAuth(authRequest)
            
            // Handle MFA challenge
            if (authResponse.challengeName() != null) {
                when (authResponse.challengeName()) {
                    ChallengeNameType.SOFTWARE_TOKEN_MFA -> {
                        throw AuthenticationException("MFA required", "MFA_REQUIRED")
                    }
                    ChallengeNameType.SMS_MFA -> {
                        throw AuthenticationException("SMS MFA required", "SMS_MFA_REQUIRED")
                    }
                    else -> {
                        throw AuthenticationException("Additional authentication required", "CHALLENGE_REQUIRED")
                    }
                }
            }
            
            val authenticationResult = authResponse.authenticationResult()
            return LoginResponse(
                accessToken = authenticationResult.accessToken(),
                refreshToken = authenticationResult.refreshToken(),
                expiresIn = authenticationResult.expiresIn()
            )
        } catch (e: NotAuthorizedException) {
            logger.warn(e) { "Login failed for user: ${request.username}" }
            throw AuthenticationException("Invalid credentials")
        } catch (e: UserNotFoundException) {
            logger.warn(e) { "User not found: ${request.username}" }
            throw AuthenticationException("User not found")
        } catch (e: UserNotConfirmedException) {
            logger.warn(e) { "User not confirmed: ${request.username}" }
            throw AuthenticationException("User not confirmed")
        } catch (e: TooManyRequestsException) {
            logger.warn(e) { "Too many login attempts for user: ${request.username}" }
            throw AuthenticationException("Too many login attempts")
        } catch (e: Exception) {
            logger.error(e) { "Login error for user: ${request.username}" }
            throw AuthenticationException("Login failed")
        }
    }
    
    suspend fun loginWithMFA(request: LoginRequest, mfaCode: String): LoginResponse {
        try {
            // First, initiate auth to get session
            val authParams = mutableMapOf(
                "USERNAME" to request.username,
                "PASSWORD" to request.password
            )
            
            if (clientSecret != null) {
                val secretHash = calculateSecretHash(request.username, clientId, clientSecret)
                authParams["SECRET_HASH"] = secretHash
            }
            
            val authRequest = AdminInitiateAuthRequest.builder()
                .userPoolId(userPoolId)
                .clientId(clientId)
                .authFlow(AuthFlowType.ADMIN_NO_SRP_AUTH)
                .authParameters(authParams)
                .build()
            
            val authResponse = cognitoClient.adminInitiateAuth(authRequest)
            
            // Respond to MFA challenge
            val challengeResponse = AdminRespondToAuthChallengeRequest.builder()
                .userPoolId(userPoolId)
                .clientId(clientId)
                .challengeName(authResponse.challengeName())
                .session(authResponse.session())
                .challengeResponses(mapOf(
                    "SOFTWARE_TOKEN_MFA_CODE" to mfaCode,
                    "USERNAME" to request.username
                ))
                .build()
            
            val challengeResult = cognitoClient.adminRespondToAuthChallenge(challengeResponse)
            val authenticationResult = challengeResult.authenticationResult()
            
            return LoginResponse(
                accessToken = authenticationResult.accessToken(),
                refreshToken = authenticationResult.refreshToken(),
                expiresIn = authenticationResult.expiresIn()
            )
        } catch (e: CodeMismatchException) {
            logger.warn(e) { "Invalid MFA code for user: ${request.username}" }
            throw AuthenticationException("Invalid MFA code")
        } catch (e: ExpiredCodeException) {
            logger.warn(e) { "Expired MFA code for user: ${request.username}" }
            throw AuthenticationException("MFA code expired")
        } catch (e: Exception) {
            logger.error(e) { "MFA login error for user: ${request.username}" }
            throw AuthenticationException("MFA login failed")
        }
    }
    
    private fun calculateSecretHash(username: String, clientId: String, clientSecret: String): String {
        val message = "$username$clientId"
        val key = clientSecret.toByteArray()
        val data = message.toByteArray()
        
        val mac = javax.crypto.Mac.getInstance("HmacSHA256")
        val secretKeySpec = javax.crypto.spec.SecretKeySpec(key, "HmacSHA256")
        mac.init(secretKeySpec)
        val hash = mac.doFinal(data)
        
        return hash.joinToString("") { "%02x".format(it) }
    }
    
    override suspend fun register(request: RegisterRequest): RegisterResponse {
        try {
            // Prepare sign up parameters
            val signUpParams = mutableMapOf(
                "USERNAME" to request.username,
                "PASSWORD" to request.password,
                "EMAIL" to request.email,
                "GIVEN_NAME" to request.firstName,
                "FAMILY_NAME" to request.lastName
            )
            
            // Add client secret if configured
            if (clientSecret != null) {
                val secretHash = calculateSecretHash(request.username, clientId, clientSecret)
                signUpParams["SECRET_HASH"] = secretHash
            }
            
            val signUpRequest = SignUpRequest.builder()
                .clientId(clientId)
                .username(request.username)
                .password(request.password)
                .userAttributes(
                    AttributeType.builder().name("email").value(request.email).build(),
                    AttributeType.builder().name("given_name").value(request.firstName).build(),
                    AttributeType.builder().name("family_name").value(request.lastName).build(),
                    AttributeType.builder().name("email_verified").value("true").build()
                )
                .build()
            
            val signUpResponse = cognitoClient.signUp(signUpRequest)
            
            // Add user to appropriate group (trader role)
            try {
                val adminAddUserToGroupRequest = AdminAddUserToGroupRequest.builder()
                    .userPoolId(userPoolId)
                    .username(request.username)
                    .groupName("traders")
                    .build()
                
                cognitoClient.adminAddUserToGroup(adminAddUserToGroupRequest)
            } catch (e: Exception) {
                logger.warn(e) { "Failed to add user to group: ${request.username}" }
                // Don't fail registration if group assignment fails
            }
            
            return RegisterResponse(
                userId = signUpResponse.userSub(),
                message = if (signUpResponse.codeDeliveryDetails() != null) {
                    "User registered successfully. Please check your ${signUpResponse.codeDeliveryDetails()?.deliveryMedium()} for verification."
                } else {
                    "User registered successfully."
                }
            )
        } catch (e: UsernameExistsException) {
            logger.warn(e) { "Username already exists: ${request.username}" }
            throw ValidationException("Username already exists")
        } catch (e: InvalidPasswordException) {
            logger.warn(e) { "Invalid password for user: ${request.username}" }
            throw ValidationException("Password does not meet requirements")
        } catch (e: InvalidParameterException) {
            logger.warn(e) { "Invalid parameter for user: ${request.username}" }
            throw ValidationException("Invalid registration parameters")
        } catch (e: TooManyRequestsException) {
            logger.warn(e) { "Too many registration attempts for user: ${request.username}" }
            throw ValidationException("Too many registration attempts")
        } catch (e: Exception) {
            logger.error(e) { "Registration error for user: ${request.username}" }
            throw AuthenticationException("Registration failed")
        }
    }
    
    override suspend fun refreshToken(refreshToken: String): LoginResponse {
        try {
            val authRequest = AdminInitiateAuthRequest.builder()
                .userPoolId(userPoolId)
                .clientId(clientId)
                .authFlow(AuthFlowType.REFRESH_TOKEN_AUTH)
                .authParameters(mapOf("REFRESH_TOKEN" to refreshToken))
                .build()
            
            val authResponse = cognitoClient.adminInitiateAuth(authRequest)
            val authenticationResult = authResponse.authenticationResult()
            
            return LoginResponse(
                accessToken = authenticationResult.accessToken(),
                refreshToken = authenticationResult.refreshToken() ?: refreshToken,
                expiresIn = authenticationResult.expiresIn()
            )
        } catch (e: Exception) {
            logger.error(e) { "Token refresh failed" }
            throw AuthenticationException("Token refresh failed")
        }
    }
    
    override suspend fun logout(accessToken: String) {
        try {
            val globalSignOutRequest = GlobalSignOutRequest.builder()
                .accessToken(accessToken)
                .build()
            
            cognitoClient.globalSignOut(globalSignOutRequest)
        } catch (e: Exception) {
            logger.error(e) { "Logout failed" }
            // Don't throw exception for logout failures
        }
    }
    
    override suspend fun verifyToken(token: String): Boolean {
        return try {
            val getUserRequest = GetUserRequest.builder()
                .accessToken(token)
                .build()
            
            cognitoClient.getUser(getUserRequest)
            true
        } catch (e: Exception) {
            logger.debug(e) { "Token verification failed" }
            false
        }
    }
}

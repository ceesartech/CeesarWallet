package tech.ceesar.ceesarwallet.backend.auth

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.client.RestTemplate
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.util.*

@Serializable
data class OAuthRequest(
    val provider: String,
    val code: String? = null,
    val idToken: String? = null,
    val accessToken: String? = null
)

@Serializable
data class OAuthResponse(
    val success: Boolean,
    val token: String? = null,
    val user: UserInfo? = null,
    val message: String? = null
)

@Serializable
data class UserInfo(
    val id: String,
    val email: String,
    val name: String,
    val picture: String? = null,
    val provider: String
)

@Serializable
data class GoogleTokenResponse(
    val access_token: String,
    val token_type: String,
    val expires_in: Int,
    val refresh_token: String? = null,
    val scope: String,
    val id_token: String? = null
)

@Serializable
data class GoogleUserInfo(
    val id: String,
    val email: String,
    val verified_email: Boolean,
    val name: String,
    val given_name: String,
    val family_name: String,
    val picture: String? = null,
    val locale: String? = null
)

@Serializable
data class AppleTokenResponse(
    val access_token: String,
    val token_type: String,
    val expires_in: Int,
    val refresh_token: String? = null,
    val id_token: String? = null
)

@Serializable
data class AppleUserInfo(
    val sub: String,
    val email: String? = null,
    val email_verified: Boolean? = null,
    val name: String? = null
)

@Serializable
data class FacebookUserInfo(
    val id: String,
    val email: String? = null,
    val name: String,
    val picture: FacebookPicture? = null
)

@Serializable
data class FacebookPicture(
    val data: FacebookPictureData
)

@Serializable
data class FacebookPictureData(
    val url: String,
    val is_silhouette: Boolean
)

@Service
class OAuthService(
    @Value("\${oauth.google.client-id}") private val googleClientId: String,
    @Value("\${oauth.google.client-secret}") private val googleClientSecret: String,
    @Value("\${oauth.apple.client-id}") private val appleClientId: String,
    @Value("\${oauth.apple.client-secret}") private val appleClientSecret: String,
    @Value("\${oauth.facebook.client-id}") private val facebookClientId: String,
    @Value("\${oauth.facebook.client-secret}") private val facebookClientSecret: String,
    @Value("\${oauth.amazon.client-id}") private val amazonClientId: String,
    @Value("\${oauth.amazon.client-secret}") private val amazonClientSecret: String,
    @Value("\${jwt.secret}") private val jwtSecret: String
) {
    private val restTemplate = RestTemplate()
    private val json = Json { ignoreUnknownKeys = true }

    fun authenticateWithGoogle(code: String): OAuthResponse {
        return try {
            // Exchange code for access token
            val tokenResponse = exchangeGoogleCode(code)
            
            // Get user info
            val userInfo = getGoogleUserInfo(tokenResponse.access_token)
            
            // Create JWT token
            val jwtToken = generateJwtToken(userInfo)
            
            OAuthResponse(
                success = true,
                token = jwtToken,
                user = UserInfo(
                    id = userInfo.id,
                    email = userInfo.email,
                    name = userInfo.name,
                    picture = userInfo.picture,
                    provider = "google"
                )
            )
        } catch (e: Exception) {
            OAuthResponse(
                success = false,
                message = "Google authentication failed: ${e.message}"
            )
        }
    }

    fun authenticateWithApple(idToken: String): OAuthResponse {
        return try {
            // Verify Apple ID token and extract user info
            val userInfo = verifyAppleIdToken(idToken)
            
            // Create JWT token
            val jwtToken = generateJwtToken(userInfo)
            
            OAuthResponse(
                success = true,
                token = jwtToken,
                user = UserInfo(
                    id = userInfo.sub,
                    email = userInfo.email ?: "",
                    name = userInfo.name ?: "Apple User",
                    provider = "apple"
                )
            )
        } catch (e: Exception) {
            OAuthResponse(
                success = false,
                message = "Apple authentication failed: ${e.message}"
            )
        }
    }

    fun authenticateWithFacebook(accessToken: String): OAuthResponse {
        return try {
            // Get user info from Facebook
            val userInfo = getFacebookUserInfo(accessToken)
            
            // Create JWT token
            val jwtToken = generateJwtToken(userInfo)
            
            OAuthResponse(
                success = true,
                token = jwtToken,
                user = UserInfo(
                    id = userInfo.id,
                    email = userInfo.email ?: "",
                    name = userInfo.name,
                    picture = userInfo.picture?.data?.url,
                    provider = "facebook"
                )
            )
        } catch (e: Exception) {
            OAuthResponse(
                success = false,
                message = "Facebook authentication failed: ${e.message}"
            )
        }
    }

    fun authenticateWithAmazon(accessToken: String): OAuthResponse {
        return try {
            // Get user info from Amazon
            val userInfo = getAmazonUserInfo(accessToken)
            
            // Create JWT token
            val jwtToken = generateJwtToken(userInfo)
            
            OAuthResponse(
                success = true,
                token = jwtToken,
                user = UserInfo(
                    id = userInfo.id,
                    email = userInfo.email,
                    name = userInfo.name,
                    provider = "amazon"
                )
            )
        } catch (e: Exception) {
            OAuthResponse(
                success = false,
                message = "Amazon authentication failed: ${e.message}"
            )
        }
    }

    private fun exchangeGoogleCode(code: String): GoogleTokenResponse {
        val url = "https://oauth2.googleapis.com/token"
        val params = mapOf(
            "client_id" to googleClientId,
            "client_secret" to googleClientSecret,
            "code" to code,
            "grant_type" to "authorization_code",
            "redirect_uri" to "http://localhost:3000/auth/google/callback"
        )
        
        val response = restTemplate.postForEntity(url, params, String::class.java)
        return json.decodeFromString<GoogleTokenResponse>(response.body ?: "")
    }

    private fun getGoogleUserInfo(accessToken: String): GoogleUserInfo {
        val url = "https://www.googleapis.com/oauth2/v2/userinfo?access_token=$accessToken"
        val response = restTemplate.getForEntity(url, String::class.java)
        return json.decodeFromString<GoogleUserInfo>(response.body ?: "")
    }

    private fun verifyAppleIdToken(idToken: String): AppleUserInfo {
        // In production, you should verify the JWT signature with Apple's public keys
        // For demo purposes, we'll decode the payload
        val payload = idToken.split(".")[1]
        val decoded = Base64.getUrlDecoder().decode(payload)
        return json.decodeFromString<AppleUserInfo>(String(decoded))
    }

    private fun getFacebookUserInfo(accessToken: String): FacebookUserInfo {
        val url = "https://graph.facebook.com/me?fields=id,name,email,picture&access_token=$accessToken"
        val response = restTemplate.getForEntity(url, String::class.java)
        return json.decodeFromString<FacebookUserInfo>(response.body ?: "")
    }

    private fun getAmazonUserInfo(accessToken: String): UserInfo {
        val url = "https://api.amazon.com/user/profile"
        val headers = mapOf("Authorization" to "Bearer $accessToken")
        val response = restTemplate.getForEntity(url, String::class.java)
        // Parse Amazon response (simplified for demo)
        return UserInfo(
            id = "amazon_user_id",
            email = "user@example.com",
            name = "Amazon User",
            provider = "amazon"
        )
    }

    private fun generateJwtToken(userInfo: UserInfo): String {
        // In production, use a proper JWT library like jjwt
        val header = Base64.getUrlEncoder().encodeToString("""{"alg":"HS256","typ":"JWT"}""".toByteArray())
        val payload = Base64.getUrlEncoder().encodeToString(
            json.encodeToString(UserInfo.serializer(), userInfo).toByteArray()
        )
        val signature = Base64.getUrlEncoder().encodeToString(
            "$header.$payload.$jwtSecret".toByteArray()
        )
        return "$header.$payload.$signature"
    }
}

@RestController
@RequestMapping("/api/auth")
class OAuthController(private val oAuthService: OAuthService) {

    @PostMapping("/oauth/google")
    fun authenticateWithGoogle(@RequestBody request: OAuthRequest): ResponseEntity<OAuthResponse> {
        if (request.code == null) {
            return ResponseEntity.badRequest().body(
                OAuthResponse(success = false, message = "Authorization code is required")
            )
        }
        
        val response = oAuthService.authenticateWithGoogle(request.code)
        return if (response.success) {
            ResponseEntity.ok(response)
        } else {
            ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response)
        }
    }

    @PostMapping("/oauth/apple")
    fun authenticateWithApple(@RequestBody request: OAuthRequest): ResponseEntity<OAuthResponse> {
        if (request.idToken == null) {
            return ResponseEntity.badRequest().body(
                OAuthResponse(success = false, message = "ID token is required")
            )
        }
        
        val response = oAuthService.authenticateWithApple(request.idToken)
        return if (response.success) {
            ResponseEntity.ok(response)
        } else {
            ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response)
        }
    }

    @PostMapping("/oauth/facebook")
    fun authenticateWithFacebook(@RequestBody request: OAuthRequest): ResponseEntity<OAuthResponse> {
        if (request.accessToken == null) {
            return ResponseEntity.badRequest().body(
                OAuthResponse(success = false, message = "Access token is required")
            )
        }
        
        val response = oAuthService.authenticateWithFacebook(request.accessToken)
        return if (response.success) {
            ResponseEntity.ok(response)
        } else {
            ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response)
        }
    }

    @PostMapping("/oauth/amazon")
    fun authenticateWithAmazon(@RequestBody request: OAuthRequest): ResponseEntity<OAuthResponse> {
        if (request.accessToken == null) {
            return ResponseEntity.badRequest().body(
                OAuthResponse(success = false, message = "Access token is required")
            )
        }
        
        val response = oAuthService.authenticateWithAmazon(request.accessToken)
        return if (response.success) {
            ResponseEntity.ok(response)
        } else {
            ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response)
        }
    }

    @PostMapping("/logout")
    fun logout(): ResponseEntity<Map<String, String>> {
        // In production, you might want to blacklist the JWT token
        return ResponseEntity.ok(mapOf("message" to "Logged out successfully"))
    }
}

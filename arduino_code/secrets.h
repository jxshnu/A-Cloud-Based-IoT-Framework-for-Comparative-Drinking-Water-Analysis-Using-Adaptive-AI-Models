// include/secrets.h
#include <pgmspace.h>

#define SECRET
#define THINGNAME "esp32_water_monitor" 

// --- Your Wi-Fi Credentials ---
const char WIFI_SSID[] = "R"; 
const char WIFI_PASSWORD[] = "v; 

// --- Your AWS IoT Endpoint ---
const char AWS_IOT_ENDPOINT[] = "x"; 


// --- Your Certificates ---

// Amazon Root CA 1
// Open your Amazon Root CA 1 file and paste the full text here
static const char AWS_CERT_CA[] PROGMEM = R"EOF(
-----BEGIN CERTIFICATE-----

-----END CERTIFICATE-----
)EOF"; 

// Device Certificate
// Open your device certificate .crt file and paste the full text here
static const char AWS_CERT_CRT[] PROGMEM = R"KEY(
-----BEGIN CERTIFICATE-----

-----END CERTIFICATE-----
)KEY"; 

// Device Private Key
// Open your private key .key file and paste the full text here
static const char AWS_CERT_PRIVATE[] PROGMEM = R"KEY(
-----BEGIN RSA PRIVATE KEY-----

-----END RSA PRIVATE KEY-----
)KEY"; 
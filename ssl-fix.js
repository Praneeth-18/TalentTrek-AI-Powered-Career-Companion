// This file disables SSL certificate verification 
// Only use this in development or when connecting to databases with self-signed certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
console.log("SSL certificate verification disabled for development purposes");

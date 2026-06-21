<?php
/**
 * Configuration File for LINE OA Integration
 * 
 * Please edit the database credentials below.
 */

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'your_database_username');
define('DB_PASS', 'your_database_password');
define('DB_NAME', 'your_database_name');
define('DB_PORT', '3306'); // Default is 3306

// LINE Official Account Configurations
// Channel Secret (Used for webhook signature verification)
define('LINE_CHANNEL_SECRET', 'f786a5c1ddef82b3dfb7f02a2b44f235');

// Channel Access Token (Fallback constant if DB value is empty)
define('LINE_CHANNEL_ACCESS_TOKEN', 'UOI2WYzeTBIIhPuzPll0yJy4xYqdr0gyU8+DkcuyU6/B4T7WfPCoqcDqJcmiRKzuzRt9thJie9cYTjktQk/izYMHi1qxAvcI+SKb49RSAf1QUNknL3IoaSPgI4ZzIPhM3CB7TeBZYWeDXkYzRSD2TAdB04t89/1O/w1cDnyilFU=');

// Logging Configuration (Highly useful for debugging webhooks on shared hosting)
define('DEBUG_LOG', true);
define('LOG_FILE', __DIR__ . '/webhook_debug.log');

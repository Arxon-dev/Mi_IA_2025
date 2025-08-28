<?php
// This is a temporary diagnostic script to locate the correct PHP error log file.
// It can be safely deleted after use.

// This message is intentionally unique to make it easy to find.
error_log("GEMINI_LOG_LOCATION_TEST_159753_ABCXYZ");

echo "<h1>Log Location Test Executed</h1>";
echo "<p>A unique message has been written to the server's PHP error log.</p>";
echo "<p>Please check your server's log files for the string: <strong>GEMINI_LOG_LOCATION_TEST_159753_ABCXYZ</strong></p>";
echo "<p>If you have shell access, you can try running a command like:</p>";
echo "<pre>grep -r 'GEMINI_LOG_LOCATION_TEST_159753_ABCXYZ' /var/log/</pre>";
echo "<p>Once you find the log file, please check it for the 'Telegram Mapper Debug' messages after running a quiz.</p>"; 
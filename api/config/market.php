<?php
/**
 * Market feature flags. Keep Canada commerce disabled until the owner approves
 * Moneris/API testing and the launch checklist is complete.
 */
if (!defined('CANADA_MARKET_ENABLED')) {
    define('CANADA_MARKET_ENABLED', getenv('CANADA_MARKET_ENABLED') === '1');
}
function requireCanadaMarketEnabled(): void {
    if (!CANADA_MARKET_ENABLED) {
        jsonError('Canada marketplace and checkout are currently unavailable while Moneris setup is pending.', 503);
    }
}

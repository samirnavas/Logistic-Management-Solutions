const cron = require('node-cron');
const Quotation = require('../models/Quotation');

/**
 * Initialize all scheduled background jobs
 * This function should be called once when the server starts
 */
function initScheduledJobs() {
    console.log('📅 Initializing scheduled jobs...');

    // Schedule task to check and expire quotations every midnight (00:00)
    // Cron format: '0 0 * * *' = At 00:00 (midnight) every day
    cron.schedule('0 0 * * *', async () => {
        console.log('🕐 Running scheduled job: Checking for expired quotations...');

        try {
            await expireOldQuotations();
        } catch (error) {
            console.error('❌ Error in scheduled job (expire quotations):', error);
        }
    });

    console.log('✅ Scheduled jobs initialized successfully');
    console.log('   - Quotation expiry check: Daily at midnight (00:00)');
}

/**
 * Find and expire all quotations that have passed their validUntil date
 * Updates status to 'EXPIRED' and adds entry to statusHistory
 * 
 * @returns {Promise<void>}
 */
async function expireOldQuotations() {
    try {
        const now = new Date();

        // Find all quotations where:
        // 1. status is 'QUOTATION_SENT' (not yet accepted/rejected)
        // 2. validUntil is less than current date (expired)
        const expiredQuotations = await Quotation.find({
            status: 'QUOTATION_SENT',
            validUntil: { $lt: now }
        });

        if (expiredQuotations.length === 0) {
            console.log('ℹ️  No expired quotations found.');
            return;
        }

        console.log(`📋 Found ${expiredQuotations.length} expired quotation(s). Processing...`);

        let successCount = 0;
        let errorCount = 0;

        // Update each expired quotation
        for (const quotation of expiredQuotations) {
            try {
                // Update status to EXPIRED
                quotation.status = 'EXPIRED';

                // Add entry to statusHistory for audit trail
                quotation.statusHistory.push({
                    status: 'EXPIRED',
                    changedBy: null, // System action, no user
                    reason: 'System Auto-Expiry: Quotation validity period ended',
                    timestamp: now
                });

                // Save the updated quotation
                await quotation.save();

                successCount++;
                console.log(`   ✓ Expired: ${quotation.quotationId || quotation.quotationNumber}`);
            } catch (error) {
                errorCount++;
                console.error(`   ✗ Error expiring ${quotation.quotationId || quotation.quotationNumber}:`, error.message);
            }
        }

        console.log(`✅ Expiry process completed:`);
        console.log(`   - Successfully expired: ${successCount} quotation(s)`);
        if (errorCount > 0) {
            console.log(`   - Errors: ${errorCount} quotation(s)`);
        }
    } catch (error) {
        console.error('❌ Error in expireOldQuotations:', error);
        throw error; // Re-throw to be caught by the scheduled job handler
    }
}

module.exports = { initScheduledJobs };

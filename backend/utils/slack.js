const axios = require('axios');

exports.triggerSlackNotification = async (webhookUrl, text) => {
    if (!webhookUrl || typeof webhookUrl !== 'string' || !webhookUrl.startsWith('http')) return;
    try {
        await axios.post(webhookUrl, {
            blocks: [
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `🚀 *Startup OS Execution Alert*\n${text}`
                    }
                }
            ]
        });
    } catch (err) {
        console.error("Slack Notification Broadcast Failed:", err.message);
    }
};

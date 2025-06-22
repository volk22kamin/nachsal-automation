const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "my-bot-session"
    }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    }
});


const GROUP_ID = '972524407747-1568559897@g.us';
const HUSBAND_ID = '972587702259@c.us';


if (process.env.LOGIN === 'true') {
    client.on('qr', qr => {
       qrcode.generate(qr, { small: true });
    });
}

function getLocalHour() {
    const now = new Date();
    const localHour = new Intl.DateTimeFormat('he-IL', {
        timeZone: 'Asia/Jerusalem',
        hour: 'numeric',
        hour12: false
    }).format(now);
    return parseInt(localHour, 10);
}

const ACTIVE_HOURS = {
    start: 22,
    end: 9
};


function isWithinActiveHours() {
    const hour = getLocalHour();
    console.log(hour);

    if (ACTIVE_HOURS.start > ACTIVE_HOURS.end) {
        return (hour >= ACTIVE_HOURS.start || hour < ACTIVE_HOURS.end);
    } else {
        return (hour >= ACTIVE_HOURS.start && hour < ACTIVE_HOURS.end);
    }
}



let triggerPending = false;
let someoneIsHome = false;
let YOUR_BOT_ID = null;
let homeReplyCount = 0;


client.on('ready', () => {
    YOUR_BOT_ID = client.info.me._serialized;
    console.log("🤖 Bot is ready! My ID:", YOUR_BOT_ID);
});

client.on('message', async msg => {
    const from = msg.from;
    const body = msg.body;

    const isTrigger = /נכס["]?ל/.test(body);
    const isHomeReply = /ב?בית/.test(body);

    console.log(`📩 Message from ${from}: "${body}"`);
    console.log(`▶ triggerPending: ${triggerPending}, someoneIsHome: ${someoneIsHome}`);
    console.log(isWithinActiveHours() ? "✅ Within active hours" : "❌ Outside active hours");
    if (isWithinActiveHours()) {
        console.log("⏰ Active hours check passed");
        if (isTrigger) {
            console.log("🧲 Trigger phrase detected — waiting for someone to say בית...");
            triggerPending = true;
            homeReplyCount = 0;

            setTimeout(() => {
                triggerPending = false;
                homeReplyCount = 0;
                console.log("⏳ Trigger expired after timeout");
            }, 5 * 60 * 1000); // 5 minutes
        }

        if (isHomeReply && from !== YOUR_BOT_ID) {
            homeReplyCount++;
            console.log(`🏠 Someone replied בית. Count: ${homeReplyCount}`);

            if (triggerPending && homeReplyCount >= 3) {
                console.log("✅ Conditions met. Sending reply in 10s...");
                setTimeout(() => {
                    msg.reply("בבית");
                }, 10000);

                // Reset both
                someoneIsHome = false;
                triggerPending = false;
                homeReplyCount = 0;
            } else {
                console.log("⛔ No pending trigger. Ignoring reply.");
            }
        }
    }
});


client.initialize();
const webpush = require('web-push');

console.log('Generating VAPID Keys for Push Notifications...\n');
const vapidKeys = webpush.generateVAPIDKeys();

console.log('--- ADD THESE TO YOUR .env FILE ---\n');
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log('\n-----------------------------------');
console.log('Keep the private key secret!');

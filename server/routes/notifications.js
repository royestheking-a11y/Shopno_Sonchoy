const express = require('express');
const router = express.Router();
const webpush = require('web-push');
const Subscription = require('../models/Subscription');
const User = require('../models/User');

// Configure web-push
// Keys should be loaded from env, we set some fallbacks for safety if missing, 
// but web-push requires real valid VAPID keys to actually send.
const publicVapidKey = process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBtc3sOE_Z0CUy2q6K5t7Pj1E';
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || '8X3B8yJ6P47sWl2h3P-1rA8y_m5F0Y5D-2S_3sT5s8o';

webpush.setVapidDetails(
  'mailto:admin@shopnosonchoy.com',
  publicVapidKey,
  privateVapidKey
);

// Get Public Key (used by frontend to subscribe)
router.get('/vapidPublicKey', (req, res) => {
  res.json({ publicKey: publicVapidKey });
});

// Subscribe Route
router.post('/subscribe', async (req, res) => {
  try {
    const { subscription, userId } = req.body;

    if (!subscription || !userId) {
      return res.status(400).json({ error: 'Subscription object and userId are required.' });
    }

    // Save or update subscription
    await Subscription.findOneAndUpdate(
      { userId, 'subscription.endpoint': subscription.endpoint },
      { userId, subscription },
      { upsert: true, new: true }
    );

    res.status(201).json({ message: 'Subscription saved successfully.' });
  } catch (error) {
    console.error('Subscription Error:', error);
    res.status(500).json({ error: 'Failed to save subscription.' });
  }
});

// Send Notification Route (Admin Only ideally, but open for system events)
router.post('/send', async (req, res) => {
  try {
    const { title, body, userId } = req.body;
    
    let query = {};
    // If userId provided, send only to them, otherwise broadcast to all
    if (userId && userId !== 'all') {
      query.userId = userId;
    }

    const subscriptions = await Subscription.find(query);

    const payload = JSON.stringify({
      title: title || 'New Notification',
      body: body || 'You have a new message.',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png'
    });

    const sendPromises = subscriptions.map(sub => {
      return webpush.sendNotification(sub.subscription, payload)
        .catch(err => {
          console.error('Error sending push to endpoint:', sub.subscription.endpoint, err);
          // If the endpoint is gone/unsubscribed, remove it from DB
          if (err.statusCode === 404 || err.statusCode === 410) {
            return Subscription.deleteOne({ _id: sub._id });
          }
        });
    });

    await Promise.all(sendPromises);

    res.status(200).json({ message: `Notifications sent to ${subscriptions.length} devices.` });
  } catch (error) {
    console.error('Send Notification Error:', error);
    res.status(500).json({ error: 'Failed to send notifications.' });
  }
});

module.exports = router;

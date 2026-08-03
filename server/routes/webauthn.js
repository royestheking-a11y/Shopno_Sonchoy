const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require('@simplewebauthn/server');

// Using basic auth middleware to get logged in user for registration
const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No auth token' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    req.user = await User.findById(decoded.id);
    if (!req.user) return res.status(404).json({ message: 'User not found' });
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const rpName = 'Shopno Sonchoy';

const getWebAuthnConfig = (req) => {
  // WebAuthn relies on the domain where the frontend is hosted, not the backend API
  // We extract the exact frontend domain from the Origin or Referer header
  const originHeader = req.headers.origin || req.headers.referer || '';
  
  let expectedOrigin = originHeader;
  // Remove trailing slash if present
  if (expectedOrigin.endsWith('/')) {
    expectedOrigin = expectedOrigin.slice(0, -1);
  }

  let rpID;
  try {
    // Parse the origin to extract the hostname (e.g., 'localhost' or 'shopno-sonchoy.onrender.com')
    const url = new URL(expectedOrigin);
    rpID = url.hostname;
  } catch (e) {
    // Fallback if origin is completely missing (unlikely in browsers)
    rpID = 'localhost';
    expectedOrigin = 'http://localhost:5173';
  }

  return { rpID, expectedOrigin };
};

router.get('/generate-registration-options', auth, async (req, res) => {
  try {
    const user = req.user;
    const { rpID } = getWebAuthnConfig(req);

    // Convert MongoDB ObjectId string to Uint8Array for SimpleWebAuthn compatibility
    const userIDString = user._id.toString();
    const userIDUint8Array = new Uint8Array(Buffer.from(userIDString, 'utf8'));

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: userIDUint8Array,
      userName: user.email,
      userDisplayName: user.name,
      // Don't prompt users for their authenticator if they already registered it
      excludeCredentials: user.passkeys.map(passkey => ({
        id: passkey.credentialID,
        type: 'public-key',
        transports: passkey.transports,
      })),
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'preferred',
      },
    });

    // Save challenge to user
    user.currentChallenge = options.challenge;
    await user.save();

    res.json(options);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/verify-registration', auth, async (req, res) => {
  try {
    const user = req.user;
    const body = req.body;
    const { rpID, expectedOrigin } = getWebAuthnConfig(req);

    const expectedChallenge = user.currentChallenge;

    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: body,
        expectedChallenge,
        expectedOrigin,
        expectedRPID: rpID,
      });
    } catch (error) {
      console.error(error);
      return res.status(400).json({ error: error.message });
    }

    const { verified, registrationInfo } = verification;

    if (verified && registrationInfo) {
      const { credential } = registrationInfo;

      const newPasskey = {
        credentialID: credential.id,
        credentialPublicKey: Buffer.from(credential.publicKey).toString('base64url'),
        counter: credential.counter,
        transports: credential.transports || body.response.transports || [],
      };

      user.passkeys.push(newPasskey);
      user.currentChallenge = undefined;
      await user.save();

      return res.json({ verified: true });
    }

    res.status(400).json({ error: 'Verification failed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/generate-authentication-options', async (req, res) => {
  try {
    const { rpID } = getWebAuthnConfig(req);

    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: 'preferred',
    });

    // We save the challenge temporarily in a standalone collection since we don't know the user yet
    const Challenge = require('../models/Challenge');
    const newChallenge = new Challenge({ challenge: options.challenge });
    await newChallenge.save();

    res.json({
      options,
      challengeId: newChallenge._id
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/verify-authentication', async (req, res) => {
  try {
    const { response, challengeId } = req.body;
    const { rpID, expectedOrigin } = getWebAuthnConfig(req);
    
    const Challenge = require('../models/Challenge');
    const challengeDoc = await Challenge.findById(challengeId);
    
    if (!challengeDoc) {
      return res.status(400).json({ message: 'Authentication session expired or invalid. Please try again.' });
    }
    
    const expectedChallenge = challengeDoc.challenge;
    const userHandle = response.response.userHandle; // The user._id string stored in the credential

    if (!userHandle) {
      return res.status(400).json({ message: 'Biometric credential does not contain user information.' });
    }

    // Convert base64url userHandle to string
    const userIdString = Buffer.from(userHandle, 'base64url').toString('utf8');
    const user = await User.findById(userIdString);

    if (!user) return res.status(404).json({ message: 'User not found for this credential' });

    const bodyCredIDBuffer = Buffer.from(response.id, 'base64url');

    const passkey = user.passkeys.find(
      (key) => Buffer.compare(Buffer.from(key.credentialID, 'base64url'), bodyCredIDBuffer) === 0
    );

    if (!passkey) {
      return res.status(400).json({ message: 'Credential not recognized' });
    }

    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge,
        expectedOrigin,
        expectedRPID: rpID,
        credential: {
          id: passkey.credentialID,
          publicKey: new Uint8Array(Buffer.from(passkey.credentialPublicKey, 'base64url')),
          counter: passkey.counter,
          transports: passkey.transports,
        },
      });
    } catch (error) {
      console.error(error);
      return res.status(400).json({ error: error.message });
    }

    const { verified, authenticationInfo } = verification;

    if (verified) {
      // Update counter
      passkey.counter = authenticationInfo.newCounter;
      await user.save();
      await Challenge.findByIdAndDelete(challengeId); // Clean up

      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '1d' });
      const userObj = user.toObject();
      delete userObj.password;

      return res.json({ verified: true, token, user: userObj });
    }

    res.status(400).json({ error: 'Authentication failed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

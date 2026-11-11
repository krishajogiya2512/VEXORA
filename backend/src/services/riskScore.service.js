'use strict';

/**
 * @fileoverview RiskScoreService – comprehensive, explainable risk-scoring engine
 * for social-media profile authenticity analysis.
 *
 * Design principles:
 *  • No single indicator is treated as proof of a fake account.
 *  • Missing data reduces **confidence**, it does NOT inflate the risk score.
 *  • Every point added to the score has a human-readable reason.
 *  • The output is fully serialisable and suitable for storage in MongoDB.
 *
 * @module services/riskScore.service
 */

// ── Constants ────────────────────────────────────────────────────────────────

/** Indicator weight map (must total 100) */
const WEIGHTS = Object.freeze({
  followerRatio: 15,
  profilePicture: 10,
  bio: 10,
  accountAge: 12,
  activityLevel: 15,
  followerCount: 10,
  postingPatterns: 10,
  verificationStatus: 5,
  usernamePatterns: 8,
  profileConsistency: 5,
});

/** Risk-level thresholds */
const RISK_THRESHOLDS = Object.freeze({
  LOW: 29,
  MEDIUM: 59,
  HIGH: 79,
  // everything above 79 → CRITICAL
});

/** Human-readable recommendation strings keyed by risk level */
const RECOMMENDATIONS = Object.freeze({
  LOW: 'No immediate action required. Profile appears normal.',
  MEDIUM: 'Profile shows some suspicious indicators. Consider monitoring.',
  HIGH: 'Profile shows significant suspicious patterns. Manual verification recommended.',
  CRITICAL:
    'Profile shows strong indicators of being fake/suspicious. Immediate manual review and verification required.',
});

/**
 * Regex that matches "random-looking" usernames:
 * – four or more consecutive digits
 * – underscores or dots sandwiched between very short letter groups
 * – overall length dominated by digits
 */
const RANDOM_USERNAME_PATTERNS = [
  /\d{4,}/, // four+ consecutive digits
  /^[a-z]{1,3}[_.\d]{2,}[a-z]{0,3}$/i, // short-letter prefix + filler + short suffix
  /^[a-z0-9]{15,}$/i, // very long alphanumeric blob
];

/**
 * Patterns typically found in spam / phishing bios.
 */
const SUSPICIOUS_BIO_PATTERNS = [
  /https?:\/\/\S+.*https?:\/\/\S+/i, // two or more URLs
  /\b(earn|make)\s+\$?\d+.*\b(day|hour|week)\b/i, // "earn $xxx per day"
  /\bfollow\s+(?:me|back)\b/i, // "follow me / follow back"
  /\b(dm|message)\s+(?:me|for)\b/i, // "DM me for …"
  /\b(crypto|bitcoin|forex|nft)\b.*\b(invest|profit|earn)\b/i,
];

// ── Helper utilities ─────────────────────────────────────────────────────────

/**
 * Clamp a number between `min` and `max`.
 * @param {number} n
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

/**
 * Calculate a very simple normalised character-level similarity between two
 * strings (Sørensen–Dice coefficient on bigrams).  Returns 0-1.
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
const bigramSimilarity = (a, b) => {
  if (!a || !b) return 0;
  const s1 = a.toLowerCase().replace(/[^a-z0-9]/g, '');
  const s2 = b.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (s1.length < 2 || s2.length < 2) return s1 === s2 ? 1 : 0;

  const bigrams = (str) => {
    const set = new Map();
    for (let i = 0; i < str.length - 1; i++) {
      const bi = str.substring(i, i + 2);
      set.set(bi, (set.get(bi) || 0) + 1);
    }
    return set;
  };

  const bg1 = bigrams(s1);
  const bg2 = bigrams(s2);
  let intersection = 0;
  for (const [bi, count] of bg1) {
    intersection += Math.min(count, bg2.get(bi) || 0);
  }
  return (2 * intersection) / (s1.length - 1 + (s2.length - 1));
};

/**
 * Calculate the number of days between a date and now.
 * Returns `null` when the input is falsy / invalid.
 * @param {Date|string|null} date
 * @returns {number|null}
 */
const daysSince = (date) => {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / 86_400_000);
};

/**
 * Count the proportion of digit characters in a string.
 * @param {string} str
 * @returns {number} 0-1
 */
const digitRatio = (str) => {
  if (!str || str.length === 0) return 0;
  const digits = (str.match(/\d/g) || []).length;
  return digits / str.length;
};

// ── RiskScoreService ─────────────────────────────────────────────────────────

class RiskScoreService {
  /**
   * Main entry point – analyse a profile data object and return a complete,
   * explainable risk-assessment result.
   *
   * @param {object} profileData - Flat profile data (or Mongoose document).
   * @returns {{
   *   riskScore: number,
   *   riskLevel: 'LOW'|'MEDIUM'|'HIGH'|'CRITICAL',
   *   confidenceScore: number,
   *   indicators: Array<{name:string,detected:boolean,weight:number,score:number,reason:string,category:string}>,
   *   suspiciousPatterns: Array<{pattern:string,description:string,severity:string}>,
   *   recommendation: string,
   *   detectionMethod: 'rule_based'
   * }}
   */
  analyzeProfile(profileData) {
    // Normalise Mongoose documents to plain objects
    const profile =
      typeof profileData?.toObject === 'function'
        ? profileData.toObject()
        : { ...profileData };

    // Run every indicator check
    const indicators = [
      this._checkFollowerRatio(profile),
      this._checkProfilePicture(profile),
      this._checkBio(profile),
      this._checkAccountAge(profile),
      this._checkActivityLevel(profile),
      this._checkFollowerCount(profile),
      this._checkPostingPatterns(profile),
      this._checkVerificationStatus(profile),
      this._checkUsernamePatterns(profile),
      this._checkProfileConsistency(profile),
    ];

    // ── Compute weighted risk score ────────────────────────────────────────
    const riskScore = clamp(
      Math.round(indicators.reduce((sum, ind) => sum + ind.score, 0)),
      0,
      100,
    );

    // ── Determine risk level ───────────────────────────────────────────────
    const riskLevel = this._classifyRiskLevel(riskScore);

    // ── Confidence score ───────────────────────────────────────────────────
    const confidenceScore = this._calculateConfidence(indicators, profile);

    // ── Aggregate suspicious patterns ──────────────────────────────────────
    const suspiciousPatterns = this._aggregatePatterns(indicators, riskScore);

    return {
      riskScore,
      riskLevel,
      confidenceScore,
      indicators,
      suspiciousPatterns,
      recommendation: RECOMMENDATIONS[riskLevel],
      detectionMethod: 'rule_based',
    };
  }

  // ── Individual indicator checks ──────────────────────────────────────────

  /**
   * Check follower-to-following ratio.
   * Weight: 15
   * @private
   * @param {object} profile
   * @returns {object} Indicator result
   */
  _checkFollowerRatio(profile) {
    const base = {
      name: 'Follower/Following Ratio',
      weight: WEIGHTS.followerRatio,
      category: 'network',
    };

    const followers = profile.followersCount;
    const following = profile.followingCount;

    // Data availability guard
    if (followers == null && following == null) {
      return { ...base, detected: false, score: 0, reason: 'Follower/following data unavailable' };
    }

    const safeFollowers = followers ?? 0;
    const safeFollowing = following ?? 0;

    // No followers but following many
    if (safeFollowers === 0 && safeFollowing > 50) {
      return {
        ...base,
        detected: true,
        score: base.weight,
        reason: `Zero followers while following ${safeFollowing} accounts – strong indicator of a one-way bot or spam account`,
      };
    }

    // Very low ratio with significant following
    if (safeFollowing > 0 && safeFollowers / safeFollowing < 0.1 && safeFollowing > 20) {
      const ratio = (safeFollowers / safeFollowing).toFixed(3);
      return {
        ...base,
        detected: true,
        score: Math.round(base.weight * 0.7),
        reason: `Very low follower/following ratio (${ratio}) with ${safeFollowing} following – suggests aggressive follow-spam behaviour`,
      };
    }

    // Extremely high ratio on unverified account
    if (
      safeFollowing > 0 &&
      safeFollowers / safeFollowing > 100 &&
      !profile.isVerified
    ) {
      const ratio = Math.round(safeFollowers / safeFollowing);
      return {
        ...base,
        detected: true,
        score: Math.round(base.weight * 0.5),
        reason: `Unusually high follower/following ratio (${ratio}:1) on an unverified account – possible bot-network node`,
      };
    }

    return { ...base, detected: false, score: 0, reason: 'Follower/following ratio appears normal' };
  }

  /**
   * Check whether a profile picture exists.
   * Weight: 10
   * @private
   * @param {object} profile
   * @returns {object}
   */
  _checkProfilePicture(profile) {
    const base = {
      name: 'Profile Picture',
      weight: WEIGHTS.profilePicture,
      category: 'profile',
    };

    if (profile.hasProfilePicture === true) {
      return { ...base, detected: false, score: 0, reason: 'Profile picture is present' };
    }

    if (profile.hasProfilePicture === false) {
      return {
        ...base,
        detected: true,
        score: Math.round(base.weight * 0.6),
        reason: 'No profile picture – minor indicator often seen on throwaway or automated accounts',
      };
    }

    // Field not available
    return { ...base, detected: false, score: 0, reason: 'Profile picture data unavailable' };
  }

  /**
   * Check bio / description.
   * Weight: 10
   * @private
   * @param {object} profile
   * @returns {object}
   */
  _checkBio(profile) {
    const base = { name: 'Bio Analysis', weight: WEIGHTS.bio, category: 'profile' };

    if (profile.bio == null) {
      return { ...base, detected: false, score: 0, reason: 'Bio data unavailable' };
    }

    const bio = String(profile.bio).trim();

    if (bio.length === 0) {
      return {
        ...base,
        detected: true,
        score: Math.round(base.weight * 0.5),
        reason: 'Empty bio – minor indicator',
      };
    }

    if (bio.length < 5) {
      return {
        ...base,
        detected: true,
        score: Math.round(base.weight * 0.3),
        reason: `Very short bio (${bio.length} chars) – minor indicator`,
      };
    }

    // Check for suspicious content patterns
    for (const pattern of SUSPICIOUS_BIO_PATTERNS) {
      if (pattern.test(bio)) {
        return {
          ...base,
          detected: true,
          score: Math.round(base.weight * 0.8),
          reason: 'Bio contains suspicious patterns (excessive URLs, spam phrases, or promotional language)',
        };
      }
    }

    return { ...base, detected: false, score: 0, reason: 'Bio content appears normal' };
  }

  /**
   * Check account age.
   * Weight: 12
   * @private
   * @param {object} profile
   * @returns {object}
   */
  _checkAccountAge(profile) {
    const base = { name: 'Account Age', weight: WEIGHTS.accountAge, category: 'metadata' };

    const ageDays = daysSince(profile.accountCreationDate);

    if (ageDays === null) {
      return {
        ...base,
        detected: false,
        score: 0,
        reason: 'Account creation date unavailable – cannot assess',
      };
    }

    if (ageDays < 7) {
      return {
        ...base,
        detected: true,
        score: base.weight,
        reason: `Account is only ${ageDays} day(s) old – very new account, strong indicator`,
      };
    }

    if (ageDays < 30) {
      return {
        ...base,
        detected: true,
        score: Math.round(base.weight * 0.6),
        reason: `Account is ${ageDays} days old – relatively new, moderate indicator`,
      };
    }

    return {
      ...base,
      detected: false,
      score: 0,
      reason: `Account is ${ageDays} days old – sufficient history`,
    };
  }

  /**
   * Check activity level (posts, recent activity).
   * Weight: 15
   * @private
   * @param {object} profile
   * @returns {object}
   */
  _checkActivityLevel(profile) {
    const base = {
      name: 'Activity Level',
      weight: WEIGHTS.activityLevel,
      category: 'activity',
    };

    const posts = profile.postsCount;
    const lastPostDate =
      profile.accountActivity?.lastPostDate || profile.lastActivityDate || null;
    const accountAgeDays = daysSince(profile.accountCreationDate);

    // Posts data not available
    if (posts == null) {
      return { ...base, detected: false, score: 0, reason: 'Post count data unavailable' };
    }

    // Zero posts
    if (posts === 0) {
      return {
        ...base,
        detected: true,
        score: Math.round(base.weight * 0.7),
        reason: 'Account has zero posts – moderate indicator of an unused or placeholder account',
      };
    }

    // Very low posts relative to account age (< 1 post per 30 days on an older account)
    if (accountAgeDays !== null && accountAgeDays > 90 && posts / (accountAgeDays / 30) < 1) {
      return {
        ...base,
        detected: true,
        score: Math.round(base.weight * 0.4),
        reason: `Only ${posts} post(s) over ${accountAgeDays} days – very low activity relative to account age`,
      };
    }

    // No recent activity (more than 180 days since last post)
    const daysSinceLastPost = daysSince(lastPostDate);
    if (daysSinceLastPost !== null && daysSinceLastPost > 180) {
      return {
        ...base,
        detected: true,
        score: Math.round(base.weight * 0.5),
        reason: `Last post was ${daysSinceLastPost} days ago – no recent activity`,
      };
    }

    return { ...base, detected: false, score: 0, reason: 'Activity level appears normal' };
  }

  /**
   * Check absolute follower count.
   * Weight: 10
   * @private
   * @param {object} profile
   * @returns {object}
   */
  _checkFollowerCount(profile) {
    const base = {
      name: 'Follower Count',
      weight: WEIGHTS.followerCount,
      category: 'network',
    };

    const followers = profile.followersCount;

    if (followers == null) {
      return { ...base, detected: false, score: 0, reason: 'Follower count data unavailable' };
    }

    if (followers === 0) {
      return {
        ...base,
        detected: true,
        score: Math.round(base.weight * 0.7),
        reason: 'Zero followers – indicator of a brand-new or fake account',
      };
    }

    // Extremely low followers on an old account
    const accountAgeDays = daysSince(profile.accountCreationDate);
    if (followers < 5 && accountAgeDays !== null && accountAgeDays > 180) {
      return {
        ...base,
        detected: true,
        score: Math.round(base.weight * 0.5),
        reason: `Only ${followers} follower(s) after ${accountAgeDays} days – unusually low for an established account`,
      };
    }

    return { ...base, detected: false, score: 0, reason: 'Follower count appears normal' };
  }

  /**
   * Check posting patterns / frequency.
   * Weight: 10
   * @private
   * @param {object} profile
   * @returns {object}
   */
  _checkPostingPatterns(profile) {
    const base = {
      name: 'Posting Patterns',
      weight: WEIGHTS.postingPatterns,
      category: 'content',
    };

    const posts = profile.postsCount;
    const accountAgeDays = daysSince(profile.accountCreationDate);
    const frequency = profile.accountActivity?.postingFrequency;

    // Explicit posting-frequency value from the platform
    if (frequency === 'none') {
      return {
        ...base,
        detected: true,
        score: Math.round(base.weight * 0.5),
        reason: 'No posting activity recorded',
      };
    }

    if (
      (frequency === 'very_high' || frequency === 'high') &&
      accountAgeDays !== null &&
      accountAgeDays < 30
    ) {
      return {
        ...base,
        detected: true,
        score: Math.round(base.weight * 0.8),
        reason: `High posting frequency ("${frequency}") on an account only ${accountAgeDays} days old – suspicious burst behaviour`,
      };
    }

    // Fall back to raw numbers
    if (posts != null && accountAgeDays !== null && accountAgeDays > 0) {
      const postsPerDay = posts / accountAgeDays;

      if (postsPerDay > 50 && accountAgeDays < 30) {
        return {
          ...base,
          detected: true,
          score: Math.round(base.weight * 0.9),
          reason: `Extremely high posting rate (${postsPerDay.toFixed(1)} posts/day) on a new account – strongly suggestive of automation`,
        };
      }

      if (posts === 0) {
        return {
          ...base,
          detected: true,
          score: Math.round(base.weight * 0.4),
          reason: 'Zero posts – no content generated',
        };
      }
    }

    if (posts == null && !frequency) {
      return { ...base, detected: false, score: 0, reason: 'Posting data unavailable' };
    }

    return { ...base, detected: false, score: 0, reason: 'Posting patterns appear normal' };
  }

  /**
   * Check platform verification status.
   * Weight: 5
   * @private
   * @param {object} profile
   * @returns {object}
   */
  _checkVerificationStatus(profile) {
    const base = {
      name: 'Verification Status',
      weight: WEIGHTS.verificationStatus,
      category: 'profile',
    };

    if (profile.isVerified === true) {
      return {
        ...base,
        detected: false,
        score: 0,
        reason: 'Account is verified by the platform',
      };
    }

    // Not verified is NOT automatically suspicious – only flag when combined
    // with other signals.  We return a zero-score indicator so downstream
    // aggregation can reference it.
    if (profile.isVerified === false) {
      return {
        ...base,
        detected: false,
        score: 0,
        reason: 'Account is not verified – noted as data point (not suspicious on its own)',
      };
    }

    return { ...base, detected: false, score: 0, reason: 'Verification data unavailable' };
  }

  /**
   * Check username for random / auto-generated patterns.
   * Weight: 8
   * @private
   * @param {object} profile
   * @returns {object}
   */
  _checkUsernamePatterns(profile) {
    const base = {
      name: 'Username Patterns',
      weight: WEIGHTS.usernamePatterns,
      category: 'profile',
    };

    const username = profile.username || profile.normalizedUsername;

    if (!username) {
      return { ...base, detected: false, score: 0, reason: 'Username data unavailable' };
    }

    // Check digit ratio
    const dr = digitRatio(username);
    if (dr > 0.5 && username.length > 6) {
      return {
        ...base,
        detected: true,
        score: Math.round(base.weight * 0.8),
        reason: `Username "${username}" is dominated by digits (${(dr * 100).toFixed(0)}%) – consistent with auto-generated handles`,
      };
    }

    // Check regex patterns
    for (const pattern of RANDOM_USERNAME_PATTERNS) {
      if (pattern.test(username)) {
        return {
          ...base,
          detected: true,
          score: Math.round(base.weight * 0.6),
          reason: `Username "${username}" matches a pattern common in auto-generated or bot accounts`,
        };
      }
    }

    // Excessive underscores / dots separating single chars
    const segments = username.split(/[_.]+/).filter(Boolean);
    if (segments.length >= 4 && segments.every((s) => s.length <= 3)) {
      return {
        ...base,
        detected: true,
        score: Math.round(base.weight * 0.5),
        reason: `Username "${username}" has many short segments separated by underscores/dots – pattern seen in throwaway accounts`,
      };
    }

    return { ...base, detected: false, score: 0, reason: 'Username appears normal' };
  }

  /**
   * Check profile consistency (display name vs username, missing fields).
   * Weight: 5
   * @private
   * @param {object} profile
   * @returns {object}
   */
  _checkProfileConsistency(profile) {
    const base = {
      name: 'Profile Consistency',
      weight: WEIGHTS.profileConsistency,
      category: 'metadata',
    };

    const issues = [];

    // Display name vs username similarity
    if (profile.displayName && profile.username) {
      const similarity = bigramSimilarity(profile.displayName, profile.username);
      if (similarity < 0.15) {
        issues.push(
          `Display name "${profile.displayName}" has very low similarity (${(similarity * 100).toFixed(0)}%) to username "${profile.username}"`,
        );
      }
    }

    // Missing multiple core profile fields simultaneously
    const coreFields = [
      'displayName',
      'bio',
      'followersCount',
      'followingCount',
      'postsCount',
      'accountCreationDate',
    ];
    const missingCount = coreFields.filter((f) => profile[f] == null || profile[f] === '').length;

    if (missingCount >= 4) {
      issues.push(
        `${missingCount} of ${coreFields.length} core profile fields are missing – sparse profile`,
      );
    }

    if (issues.length > 0) {
      // Scale score by how many issues were found (max 2)
      const severity = Math.min(issues.length, 2) / 2;
      return {
        ...base,
        detected: true,
        score: Math.round(base.weight * severity),
        reason: issues.join('; '),
      };
    }

    return { ...base, detected: false, score: 0, reason: 'Profile fields are consistent' };
  }

  // ── Aggregation helpers ──────────────────────────────────────────────────

  /**
   * Classify an integer risk score into a level string.
   * @private
   * @param {number} score 0-100
   * @returns {'LOW'|'MEDIUM'|'HIGH'|'CRITICAL'}
   */
  _classifyRiskLevel(score) {
    if (score <= RISK_THRESHOLDS.LOW) return 'LOW';
    if (score <= RISK_THRESHOLDS.MEDIUM) return 'MEDIUM';
    if (score <= RISK_THRESHOLDS.HIGH) return 'HIGH';
    return 'CRITICAL';
  }

  /**
   * Calculate a confidence score (0-100) based on data availability.
   *
   * Each indicator that received actual data (not "unavailable") adds to
   * confidence.  The total is scaled so that a profile with ALL data
   * available reaches ~95 (we never claim 100 % confidence for rule-based
   * analysis).
   *
   * @private
   * @param {Array} indicators
   * @param {object} profile
   * @returns {number}
   */
  _calculateConfidence(indicators, profile) {
    // Count indicators that had real data to work with
    const dataAvailable = indicators.filter(
      (ind) => !ind.reason.toLowerCase().includes('unavailable'),
    ).length;

    const totalIndicators = indicators.length;

    // Base confidence from data availability (max 85 points)
    const dataConfidence = Math.round((dataAvailable / totalIndicators) * 85);

    // Bonus points for having key fields present (max 10)
    let keyFieldBonus = 0;
    if (profile.followersCount != null) keyFieldBonus += 2;
    if (profile.followingCount != null) keyFieldBonus += 2;
    if (profile.postsCount != null) keyFieldBonus += 2;
    if (profile.accountCreationDate) keyFieldBonus += 2;
    if (profile.username) keyFieldBonus += 2;

    return clamp(dataConfidence + keyFieldBonus, 0, 95);
  }

  /**
   * Build the suspiciousPatterns array from detected indicators.
   *
   * Matches the Detection model's suspiciousPatternSchema shape:
   * `{ pattern, description, severity }`.
   *
   * @private
   * @param {Array} indicators
   * @param {number} overallScore
   * @returns {Array<{pattern:string,description:string,severity:string}>}
   */
  _aggregatePatterns(indicators, overallScore) {
    const patterns = [];

    const detected = indicators.filter((i) => i.detected);

    // Individual indicator patterns
    for (const ind of detected) {
      const severity =
        ind.score >= ind.weight * 0.8
          ? 'high'
          : ind.score >= ind.weight * 0.4
            ? 'medium'
            : 'low';

      patterns.push({
        pattern: ind.name,
        description: ind.reason,
        severity,
      });
    }

    // Composite patterns
    const detectedCategories = new Set(detected.map((i) => i.category));

    if (detectedCategories.size >= 4) {
      patterns.push({
        pattern: 'Multi-category red flags',
        description: `Suspicious indicators detected across ${detectedCategories.size} different categories (${[...detectedCategories].join(', ')})`,
        severity: 'high',
      });
    }

    if (overallScore >= 60 && detected.length >= 5) {
      patterns.push({
        pattern: 'High-volume indicator cluster',
        description: `${detected.length} individual indicators triggered with a combined risk score of ${overallScore}`,
        severity: 'high',
      });
    }

    return patterns;
  }
}

module.exports = RiskScoreService;

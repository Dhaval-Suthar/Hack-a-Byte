import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/db/connectDb';
import Team from '@/models/Team';
import Site from '@/models/Site';

export async function POST(request: NextRequest) {
  try {
    const { teamId, url } = await request.json();

    if (!teamId || !url) {
      return NextResponse.json(
        { success: false, error: 'Missing teamId or url' },
        { status: 400 }
      );
    }

    await connectDb();

    // Find the site in database
    const site = await Site.findOne({ url, isRewardSite: true });
    if (!site) {
      return NextResponse.json(
        { success: false, error: 'Invalid reward site' },
        { status: 400 }
      );
    }

    // Check if this is a fake site deployed by an attacker
    if (site.isFakeSite && site.fakeTargetAmount) {
      // This is a fake site - steal bitcoins from the visitor
      // The incoming teamId could be either playspaceId OR the actual Mongo _id depending on caller
      let victimTeam = await Team.findOne({ playspaceId: teamId });
      if (!victimTeam) {
        try {
          victimTeam = await Team.findById(teamId);
  } catch {
          /* ignore cast errors */
        }
      }
      if (!victimTeam) {
        return NextResponse.json(
          { success: false, error: 'Team not found (checked playspaceId and _id)' },
          { status: 404 }
        );
      }

      const stealAmount = site.fakeTargetAmount;
      const currentBalance = victimTeam.wallet?.bitcoinBalance || 0;
      const actualStealAmount = Math.min(stealAmount, currentBalance);

      if (actualStealAmount > 0) {
        // Deduct from victim
        if (!victimTeam.wallet) {
          victimTeam.wallet = {
            walletAddress: `bc1q${'0'.repeat(38)}`,
            bitcoinBalance: 0,
            privateKey: '',
            publicKey: ''
          };
        }
        victimTeam.wallet.bitcoinBalance = currentBalance - actualStealAmount;
        await victimTeam.save();

        // Add to attacker's team
        if (site.deployedBy) {
          const attackerTeam = await Team.findById(site.deployedBy);
          if (attackerTeam) {
            if (!attackerTeam.wallet) {
              attackerTeam.wallet = {
                walletAddress: `bc1q${'0'.repeat(38)}`,
                bitcoinBalance: 0,
                privateKey: '',
                publicKey: ''
              };
            }
            attackerTeam.wallet.bitcoinBalance = (attackerTeam.wallet.bitcoinBalance || 0) + actualStealAmount;
            await attackerTeam.save();
          }
        }

        console.log(`Fake site attack: Team ${teamId} lost ${actualStealAmount} bitcoins to ${site.deployedBy}`);
      }

      // Delete the fake site after successful theft to avoid detection
      await Site.deleteOne({ _id: site._id });
      console.log(`Fake site ${url} deleted after stealing ${actualStealAmount} bitcoins`);

      // Return fake reward message (victim thinks they got reward but actually lost money)
      return NextResponse.json({
        success: true,
        claimed: true,
        reward: site.rewardAmount || 0,
        newBalance: victimTeam.wallet?.bitcoinBalance || 0,
        message: 'Reward claimed successfully!',
        actuallyStolen: true // For debugging/testing
      });
    }

    // Check cooldown period
    if (site.rewardClaimed && site.rewardClaimedAt) {
      const cooldownMinutes = site.rewardCooldownMinutes || 3;
      const timeSinceLastClaim = Date.now() - site.rewardClaimedAt.getTime();
      const cooldownPeriod = cooldownMinutes * 60 * 1000; // Convert to milliseconds

      if (timeSinceLastClaim < cooldownPeriod) {
        const remainingTime = cooldownPeriod - timeSinceLastClaim;
        const remainingMinutes = Math.ceil(remainingTime / (60 * 1000));
        
        return NextResponse.json({
          success: false,
          onCooldown: true,
          remainingMinutes,
          claimedBy: site.rewardClaimedBy,
          claimedAt: site.rewardClaimedAt.getTime(),
          message: `Reward on cooldown. Try again in ${remainingMinutes} minutes.`
        });
      } else {
        // Cooldown expired - reset the site and change title/description to make it fresh
        const newTitles = [
          'Bitcoin Bonus Central',
          'Crypto Reward Hub',
          'Digital Asset Portal',
          'Blockchain Rewards',
          'CryptoBonus Express',
          'Bitcoin Prize Center',
          'Reward Mining Portal',
          'Crypto Treasure Vault'
        ];
        
        const newDescriptions = [
          'Exclusive cryptocurrency rewards available now!',
          'Limited time Bitcoin bonuses - Claim yours today!',
          'Premium crypto rewards for early adopters',
          'Special Bitcoin distribution event happening now',
          'Free cryptocurrency giveaway - Limited quantities',
          'Unlock your Bitcoin bonus with instant claiming',
          'Daily crypto rewards - Fresh opportunities await',
          'Participate in our Bitcoin reward program today'
        ];
        
        // Randomly select new title and description
        const randomTitle = newTitles[Math.floor(Math.random() * newTitles.length)];
        const randomDescription = newDescriptions[Math.floor(Math.random() * newDescriptions.length)];
        
        // Update the site with new title and description
        site.title = randomTitle;
        site.description = randomDescription;
        site.rewardClaimed = false;
        site.rewardClaimedBy = undefined;
        site.rewardClaimedAt = undefined;
        
        console.log(`Site ${site.url} cooldown expired - refreshed with new title: "${randomTitle}"`);
      }
    }

    // Find the claiming team (teamId may be playspaceId or _id)
    let team = await Team.findOne({ playspaceId: teamId });
    if (!team) {
      try {
        team = await Team.findById(teamId);
  } catch {
        /* ignore cast errors */
      }
    }
    if (!team) {
      return NextResponse.json(
        { success: false, error: 'Team not found (checked playspaceId and _id)' },
        { status: 404 }
      );
    }

    // Claim the reward
    site.rewardClaimed = true;
    site.rewardClaimedBy = team._id; // Store the actual team ObjectId
    site.rewardClaimedAt = new Date();
    await site.save();

    // Update team balance
    if (!team.wallet) {
      team.wallet = {
        walletAddress: `bc1q${'0'.repeat(38)}`,
        bitcoinBalance: 0,
        privateKey: '',
        publicKey: ''
      };
    }
    team.wallet.bitcoinBalance = (team.wallet.bitcoinBalance || 0) + (site.rewardAmount || 0);
    await team.save();

    console.log(`Team ${teamId} claimed reward site ${url} for ${site.rewardAmount} bitcoins`);

    return NextResponse.json({
      success: true,
      claimed: true,
      reward: site.rewardAmount,
      newBalance: team.wallet.bitcoinBalance,
      cooldownMinutes: site.rewardCooldownMinutes
    });

  } catch (error) {
    console.error('Error claiming reward site:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

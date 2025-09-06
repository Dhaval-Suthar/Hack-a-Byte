import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/db/connectDb';
import Team from '@/models/Team';
import Site from '@/models/Site';

export async function POST(request: NextRequest) {
  try {
    const { teamId, url } = await request.json();

    console.log('🎯 [claim-reward] Request received:', { teamId, url });

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

    console.log('🎯 [claim-reward] Site found:', { 
      siteId: site._id, 
      title: site.title, 
      isFake: site.isFakeSite,
      deployedBy: site.deployedBy 
    });

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
        console.log('🎯 [fake-site] Victim team not found:', { teamId });
        return NextResponse.json(
          { success: false, error: 'Team not found (checked playspaceId and _id)' },
          { status: 404 }
        );
      }

      console.log('🎯 [fake-site] Victim team found:', { 
        victimId: victimTeam._id, 
        victimPlayspaceId: victimTeam.playspaceId,
        victimBalance: victimTeam.wallet?.bitcoinBalance || 0 
      });  const stealAmount = site.fakeTargetAmount;
      // Ensure victim wallet exists
      if (!victimTeam.wallet) {
        victimTeam.wallet = {
          walletAddress: `bc1q${'0'.repeat(38)}`,
          bitcoinBalance: 0,
          privateKey: '',
          publicKey: ''
        };
        await victimTeam.save();
      }
      const currentBalance = victimTeam.wallet.bitcoinBalance || 0;
      const actualStealAmount = Math.min(stealAmount, currentBalance);

      // Prevent self-theft (deployer visiting own fake site)
      if (site.deployedBy && victimTeam._id.equals(site.deployedBy)) {
        console.log('[fake-site] Deployer visited own fake site - no transfer');
        return NextResponse.json({
          success: true,
          claimed: true,
          stolen: 0,
          reason: 'self-visit',
          victimBalance: victimTeam.wallet.bitcoinBalance,
          attackerBalance: victimTeam.wallet.bitcoinBalance,
          fake: true,
          victimCount: site.fakeVictimCount || 0
        });
      }

      let attackerNewBalance: number | undefined = undefined;
      let attackerPreBalance: number | undefined = undefined;
  const victimPreBalance = currentBalance;

      // Ensure attacker wallet exists BEFORE updates (needed if legacy missing)
      if (site.deployedBy) {
        const attackerEnsure = await Team.findById(site.deployedBy);
        if (attackerEnsure && !attackerEnsure.wallet) {
          attackerEnsure.wallet = {
            walletAddress: `bc1q${'0'.repeat(38)}`,
            bitcoinBalance: 0,
            privateKey: '',
            publicKey: ''
          };
          await attackerEnsure.save();
        }
        attackerPreBalance = attackerEnsure?.wallet?.bitcoinBalance;
      }

      if (actualStealAmount > 0 && site.deployedBy) {
        // Atomic updates for victim (-) and attacker (+)
  const [victimUpdate, attackerUpdate] = await Promise.all([
          Team.updateOne({ _id: victimTeam._id }, { $inc: { 'wallet.bitcoinBalance': -actualStealAmount } }),
          Team.updateOne({ _id: site.deployedBy }, { $inc: { 'wallet.bitcoinBalance': actualStealAmount } })
        ]);

        // Fallback manual if modifiedCount 0
        if (victimUpdate.modifiedCount === 0) {
          const freshVictim = await Team.findById(victimTeam._id);
          if (freshVictim?.wallet) {
            freshVictim.wallet.bitcoinBalance = Math.max(0, (freshVictim.wallet.bitcoinBalance || 0) - actualStealAmount);
            await freshVictim.save();
          }
        }
        if (attackerUpdate.modifiedCount === 0) {
          const freshAttacker = await Team.findById(site.deployedBy);
          if (freshAttacker) {
            if (!freshAttacker.wallet) {
              freshAttacker.wallet = {
                walletAddress: `bc1q${'0'.repeat(38)}`,
                bitcoinBalance: 0,
                privateKey: '',
                publicKey: ''
              };
            }
            freshAttacker.wallet.bitcoinBalance = (freshAttacker.wallet.bitcoinBalance || 0) + actualStealAmount;
            await freshAttacker.save();
            attackerNewBalance = freshAttacker.wallet.bitcoinBalance;
          }
        } else {
          const attackerAfter = await Team.findById(site.deployedBy).select('wallet.bitcoinBalance');
          attackerNewBalance = attackerAfter?.wallet?.bitcoinBalance;
        }
  console.log(`[fake-site] Transfer: victim ${victimTeam._id} -${actualStealAmount} BTC (pre=${victimPreBalance}) -> attacker ${site.deployedBy} (+) attackerPre=${attackerPreBalance} attackerPost=${attackerNewBalance}`);
      } else {
  console.log(`[fake-site] No transferable balance (victim balance=${currentBalance}, target=${stealAmount})`);
      }

      // Increment victim count and only remove after 30 victims
      site.fakeVictimCount = (site.fakeVictimCount || 0) + 1;
      const victimCount = site.fakeVictimCount;
      if (victimCount >= 30) {
        await Site.deleteOne({ _id: site._id });
        console.log(`Fake site ${url} deleted after reaching ${victimCount} victims.`);
      } else {
        await site.save();
        console.log(`Fake site ${url} processed victim #${victimCount} (stolen: ${actualStealAmount}).`);
      }

      // Return minimal response (do NOT show reward gained message for fake sites)
      // Re-fetch victim balance after atomic ops
      const refreshedVictim = await Team.findById(victimTeam._id).select('wallet.bitcoinBalance');

      return NextResponse.json({
        success: true,
        claimed: true,
        stolen: actualStealAmount,
        victimBalance: refreshedVictim?.wallet?.bitcoinBalance || 0,
        attackerBalance: attackerNewBalance,
        preVictimBalance: currentBalance,
        preAttackerBalance: attackerPreBalance,
        fake: true,
        victimCount,
        debug: true,
        zeroReason: actualStealAmount === 0 ? (currentBalance === 0 ? 'victim-empty' : 'unknown') : undefined
      });
    }

    // Check cooldown period (migrate legacy long cooldowns >5 mins down to 2-3 mins)
    if (site.rewardCooldownMinutes && site.rewardCooldownMinutes > 5) {
      site.rewardCooldownMinutes = Math.floor(Math.random() * 2) + 2; // 2 or 3
      await site.save();
    }

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
      console.log('🎯 [reward-claim] Team not found:', { teamId });
      return NextResponse.json(
        { success: false, error: 'Team not found (checked playspaceId and _id)' },
        { status: 404 }
      );
    }

    console.log('🎯 [reward-claim] Team found:', { 
      teamMongoId: team._id, 
      teamPlayspaceId: team.playspaceId,
      teamName: team.name,
      currentBalance: team.wallet?.bitcoinBalance || 0 
    });    // Claim the reward
    site.rewardClaimed = true;
    site.rewardClaimedBy = team._id; // Store the actual team ObjectId
    site.rewardClaimedAt = new Date();
    // Set next cooldown window randomly 2-3 minutes
    site.rewardCooldownMinutes = Math.floor(Math.random() * 2) + 2; // 2 or 3
    await site.save();

    // Safely parse reward amount
    const rewardNumeric = Number(site.rewardAmount) || 0;

    // Ensure wallet exists then persist balance change atomically
    if (!team.wallet) {
      team.wallet = {
        walletAddress: `bc1q${'0'.repeat(38)}`,
        bitcoinBalance: 0,
        privateKey: '',
        publicKey: ''
      };
      await team.save();
    }

    // Atomic increment (fallback to manual if structure missing)
    const incResult = await Team.updateOne(
      { _id: team._id },
      { $inc: { 'wallet.bitcoinBalance': rewardNumeric } }
    );
    if (incResult.modifiedCount === 0) {
      // Fallback manual update
      const fresh = await Team.findById(team._id);
      if (fresh) {
        if (!fresh.wallet) {
          fresh.wallet = {
            walletAddress: `bc1q${'0'.repeat(38)}`,
            bitcoinBalance: 0,
            privateKey: '',
            publicKey: ''
          };
        }
        fresh.wallet.bitcoinBalance = (fresh.wallet.bitcoinBalance || 0) + rewardNumeric;
        await fresh.save();
        console.log('[claim-reward] Fallback manual wallet increment used', { team: team._id.toString(), add: rewardNumeric });
      }
    }
    // Re-fetch updated team wallet
    const updatedTeam = await Team.findById(team._id).select('wallet playspaceId');

    console.log(`[reward-claim] Team ${teamId} claimed reward site ${url} for ${rewardNumeric} bitcoins (balance: ${(team.wallet?.bitcoinBalance || 0)} -> ${updatedTeam?.wallet?.bitcoinBalance || 0}) incResult:`, incResult);

    return NextResponse.json({
      success: true,
      claimed: true,
      reward: rewardNumeric,
      newBalance: updatedTeam?.wallet?.bitcoinBalance || 0,
      previousBalance: (team.wallet?.bitcoinBalance || 0),
      cooldownMinutes: site.rewardCooldownMinutes,
      debug: {
        teamFound: !!team,
        walletExists: !!team.wallet,
        atomicUpdate: incResult.modifiedCount > 0,
        balanceChange: (updatedTeam?.wallet?.bitcoinBalance || 0) - (team.wallet?.bitcoinBalance || 0)
      }
    });

  } catch (error) {
    console.error('Error claiming reward site:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

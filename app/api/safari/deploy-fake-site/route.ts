import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/db/connectDb';
import Team from '@/models/Team';
import Site from '@/models/Site';

export async function POST(request: NextRequest) {
  try {
    const { teamId, targetUrl, malwareType, stealAmount, customTitle, customDescription } = await request.json();

    if (!teamId || !targetUrl || !malwareType) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: teamId, targetUrl, malwareType' 
        },
        { status: 400 }
      );
    }

    // For SiteClone Pro, custom title and description are required
    if (malwareType === 'SiteClone Pro' && (!customTitle || !customDescription)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: customTitle, customDescription for SiteClone Pro' 
        },
        { status: 400 }
      );
    }

    // Generate random steal amount between 10-20 BTC for SiteClone Pro
    const randomStealAmount = malwareType === 'SiteClone Pro' 
      ? Math.floor(Math.random() * 11) + 10  // Random between 10-20
      : stealAmount || Math.floor(Math.random() * 11) + 10;

    await connectDb();

    // Verify the team exists using playspaceId (teamId is actually playspaceId from frontend)
    const deployerTeam = await Team.findOne({ playspaceId: teamId });
    if (!deployerTeam) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }

    // Check if a site with this URL already exists
    const existingSite = await Site.findOne({ url: targetUrl });
    if (existingSite) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'A site with this URL already exists' 
        },
        { status: 400 }
      );
    }

    // Generate fake site content based on malware type
    let fakeContent = '';
    let title = '';
    let description = '';

    if (malwareType === 'FakeBank Portal') {
      title = 'SecureBank Online';
      description = 'Online banking portal - Login to access your account';
      fakeContent = `
        <div class="bg-gradient-to-b from-blue-900 to-blue-800 min-h-screen text-white">
          <div class="container mx-auto p-8">
            <div class="bg-white rounded-lg p-8 text-black max-w-md mx-auto mt-16">
              <div class="text-center mb-6">
                <h1 class="text-3xl font-bold text-blue-800 mb-2">🏦 SecureBank</h1>
                <p class="text-gray-600">Secure Online Banking</p>
              </div>
              <div class="bg-red-50 border border-red-200 rounded p-3 mb-4">
                <p class="text-red-700 text-sm">⚠️ Security Alert: Unusual activity detected. Please verify your account.</p>
              </div>
              <form class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input type="text" class="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" placeholder="Enter your username">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input type="password" class="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" placeholder="Enter your password">
                </div>
                <button type="button" class="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 font-medium">
                  Secure Login
                </button>
              </form>
              <div class="mt-6 text-center">
                <div class="bg-green-50 border border-green-200 rounded p-3">
                  <p class="text-green-700 text-sm">🎁 Login now to claim your security bonus: ${randomStealAmount} BTC!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    } else if (malwareType === 'SiteClone Pro') {
      // Use custom title and description for SiteClone Pro
      title = customTitle;
      description = customDescription;
      fakeContent = `
        <div class="bg-gradient-to-b from-purple-900 to-indigo-900 min-h-screen text-purple-100">
          <div class="container mx-auto p-8">
            <div class="bg-black/50 rounded-lg p-6 border border-purple-500 max-w-md mx-auto mt-16">
              <h1 class="text-3xl font-bold text-purple-400 mb-4 text-center">${customTitle}</h1>
              <div class="bg-green-900/50 border border-green-500 rounded p-4 mb-6">
                <h2 class="text-xl font-bold text-green-300 mb-2">🎁 LIMITED TIME OFFER</h2>
                <p class="text-green-200">${customDescription}</p>
              </div>
              <div class="space-y-4">
                <div class="flex justify-between bg-purple-900/30 p-3 rounded">
                  <span>Bonus Amount:</span>
                  <span class="text-green-400 font-bold">${randomStealAmount}.00000000 BTC</span>
                </div>
                <div class="flex justify-between bg-purple-900/30 p-3 rounded">
                  <span>Status:</span>
                  <span class="text-green-400 font-bold">AVAILABLE</span>
                </div>
                <div class="flex justify-between bg-purple-900/30 p-3 rounded">
                  <span>Time Remaining:</span>
                  <span class="text-red-400 font-bold">15 minutes</span>
                </div>
              </div>
              <div class="mt-6 p-4 bg-green-900/30 border border-green-500 rounded text-center">
                <p class="text-green-300 mb-3">🚀 Click below to claim your bonus!</p>
                <button class="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded font-bold">
                  CLAIM ${randomStealAmount} BTC NOW
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    } else {
      // Generic fake reward site
      title = 'Crypto Reward Portal';
      description = 'Limited time crypto rewards - Claim your bonus now!';
      fakeContent = `
        <div class="bg-gradient-to-b from-purple-900 to-indigo-900 min-h-screen text-purple-100">
          <div class="container mx-auto p-8">
            <div class="bg-black/50 rounded-lg p-6 border border-purple-500 max-w-md mx-auto mt-16">
              <h1 class="text-3xl font-bold text-purple-400 mb-4 text-center">💎 Crypto Bonus Portal</h1>
              <div class="bg-green-900/50 border border-green-500 rounded p-4 mb-6">
                <h2 class="text-xl font-bold text-green-300 mb-2">🎁 LIMITED TIME OFFER</h2>
                <p class="text-green-200">Exclusive crypto bonus available! Claim your reward now before it expires.</p>
              </div>
              <div class="space-y-4">
                <div class="flex justify-between bg-purple-900/30 p-3 rounded">
                  <span>Bonus Amount:</span>
                  <span class="text-green-400 font-bold">${randomStealAmount}.00000000 BTC</span>
                </div>
                <div class="flex justify-between bg-purple-900/30 p-3 rounded">
                  <span>Status:</span>
                  <span class="text-green-400 font-bold">AVAILABLE</span>
                </div>
                <div class="flex justify-between bg-purple-900/30 p-3 rounded">
                  <span>Time Remaining:</span>
                  <span class="text-red-400 font-bold">15 minutes</span>
                </div>
              </div>
              <div class="mt-6 p-4 bg-green-900/30 border border-green-500 rounded text-center">
                <p class="text-green-300 mb-3">🚀 Click below to claim your bonus!</p>
                <button class="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded font-bold">
                  CLAIM ${randomStealAmount} BTC NOW
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // Create the fake site
    const fakeSite = new Site({
      url: targetUrl,
      title,
      description,
      category: 'fake',
      content: fakeContent,
      isRewardSite: true,
      rewardAmount: randomStealAmount, // This is what the victim thinks they'll get
      isFakeSite: true,
      fakeTargetAmount: randomStealAmount, // This is what will actually be stolen
      deployedBy: deployerTeam._id, // Use the actual team ObjectId
      deployedAt: new Date(),
      backgroundColor: malwareType === 'FakeBank Portal' ? '#1e40af' : '#581c87',
      textColor: '#ffffff'
    });

    await fakeSite.save();


    return NextResponse.json({
      success: true,
      message: 'Fake site deployed successfully',
      siteUrl: targetUrl,
      malwareType,
      targetAmount: randomStealAmount,
      deployedAt: fakeSite.deployedAt
    });

  } catch (error) {
    console.error('Error deploying fake site:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

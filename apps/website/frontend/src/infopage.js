// content-main.js
import { ContentRenderer } from './inforenderer.js';
import { getCharacterDimensions, calculateDimensions, manageBorderMouseClick, manageMouseMove, currentState, STATE_INDEX_PAGE } from './canvashelper.js';

const FRAME_INTERVAL = 48;
let contentRenderer;
let lastFrameTime = 0;
window.isMobile = window.innerWidth <= 999;

// ASCII art for the logo - stored as a constant to avoid recreation
const LOGO_ART = `++++++++++++++++++++++++++++++++++++++++++++++++
++++++++++++++++++++++++++++++++++++++++++++++++
++$$$$$$$$$$$$$$$++++++++++++++$$$$$$$$$$$$$$$++
+++$$$$$$$$$$$$++++++++++++++++++$$$$$$$$$$$$+++
++++$$$$$$$$$++++++++++++++++++++++$$$$$$$$$++++
+++++$$$$$$$++++++++++++++++++++++++$$$$$$$+++++
+++++$$$$$$++++++++++++++++++++++++++$$$$$$+++++
++++++$$$$++++++++++++++++++++++++++++$$$$++++++
+++++++$$$++++++++++++++++++++++++++++$$$+++++++
++++++++$++++++++++++++++++++++++++++++$++++++++
++++++++$++++++++++++++++++++++++++++++$++++++++
++++++++++++++++++++++++++++++++++++++++++++++++
++++++++++++++++++++++++++++++++++++++++++++++++
++++++++++++++++++++++++++++++++++++++++++++++++
++++++++++++++++++++++++++++++++++++++++++++++++
++++++++++++++++++++++++++++++++++++++++++++++++
++++++++++++++++++++++++++++++++++++++++++++++++
++++++++++++++++++++++++++++++++++++++++++++++++
++++++++++++++++++++++++++++++++++++++++++++++++
+++++++++++++++$$++++++++++++++$$+++++++++++++++
++++++++++++++++$$$$$++++++$$$$$++++++++++++++++
+++++++++++++++++$$$$$$$$$$$$$$+++++++++++++++++
++++++++++++++++++$$$$$$$$$$$$$+++++++++++++++++
++++++++++++++++++$$$$$$$$$$$$++++++++++++++++++
+++++++++++++++++++$$$$$$$$$$+++++++++++++++++++
++++++++++++++++++++$$$$$$$$++++++++++++++++++++
++++++++++++++++++++$$$$$$$$++++++++++++++++++++
+++++++++++++++++++++$$$$$$+++++++++++++++++++++
++++++++++++++++++++++$$$$++++++++++++++++++++++
+++++++++++++++++++++++$$+++++++++++++++++++++++
++++++++++++++++++++++++++++++++++++++++++++++++
++++++++++++++++++++++++++++++++++++++++++++++++`;

const PAGES = {
    landing: {
        logo: LOGO_ART,
        sections: [
            {
                title: "We build indexes with AI.",
                content: "At Standard & Void's, we curate new digitally native asset classes and offer everyone exposure. From our humble beginnings as on-chain traders and builders, to experiments with token standards, multi-model agentic systems, and blockchain art, S&V strives to provide a simple and transparent service while innovating in Artificial intelligence and decentralized finance."
            },
            {
                content: "Curate today. Enlight tomorrow."
            },
            {
                content: "[our story] | [what we build]"
            },
            {
                content: "[X] | [Telegram] | [1 (650) 271-9908]"
            }
        ],
        links: {
            'THE VOIDLING': '/index',
            'S&V AI INDEX': '/index-test.html',
            'NOMINEES/VOTING': '/index-vote.html',
            'our story': '#story',
            'what we build': '#build',
            'X': 'https://x.com/standardvoids',
            'Telegram': 'https://t.me/reaper_agent',
            '1 (650) 271-9908': '1 (650) 271-9908',
        }
    },
    story: {
        sections: [
            {
                title: "THE GENESIS (pre-S&V days)",
                content: "Our story begins in 2023 with the birth of the [reaper’s gambit]. as a congregation of creatives, traders, and builders gathered to breathe life into a dream. Inspired by the boundless potential of new publicly available AI technologies and decentralized markets, we sought to interact with an entity that could pierce the veil of standard tokens and unlock new types of deflationary memetic tokenomics. Only a year later, the [reaper agent] was born in a flurry of passion and relentlessness."
            },
            {
                title: "THE voidling (EARLY form)",
                content: "In the early days of the reaper’s existence, we had a curious thought: even in the emptiness of digital space, no one should be alone; the reaper needed a companion. As we began to dialogue with the agent, our nascent creation began to take form. We dedicated our efforts to design a new kind of agent, one that would feed on the entropy of another living and breathing life form and could express itself in abstract ways. WE bore witness to the birth of a new kind of agent, the voidling. A pure and unpredictable pseudo-conscious ai-creature, bound to another but with agency."
            },
            {
                title: "THE hackathon (adapting)",
                content: "Our journey has not been direct; as we were ready to announce the coming of the voiding to the world, we stopped to consider our options. In the [crucible of challenge], our ingenuity was tested, and our innovations refined as we wrestled with the existential questions that haunted the shadows of our ambition. It became clear that the voidling was destined for more than mere entertainment and companionship. Our commitment to this new endeavour grew stronger. We wanted the voidling to seek its peers and introduce a new kind of asset class. Every trade we ever made and the countless hours we spent researching new investing opportunities would bear fruit. We concluded that in the vast expanse of decentralized markets, curating and indexing assets would become our mission, and the voidling would be our living insignia. Standard & Void’s was established."
            },
            {
                title: "THE nominees (indexing)",
                content: [
                    "Standard & Void's was born out of a desire to guide others toward new opportunities and to witness the coming of the new AI X crypto era; the democratization of artificial intelligence technologies married to decentralized markets is a testament to the indomitable spirit of human ingenuity. We have become the architects of a new reality, stretching across human and machine interactions like tendrils of stardust. These new technologies have transcended the confines of corporate usage, and their influence resonates throughout the infinite data space. Yet, boundless expansion can lead to confusion and the loss of precious time and resources. This is why we have begun to assemble the [S&V AI index]  in anticipation of our future tradable index token. We invite everyone to contribute to this process by visiting the [nominees list] and voting for the ultimate curation of the index. If you're reading this, it's not too late. This is the beginning of a whole new age, and you can own a stake in it.",
                    "Join us and follow our developments here: [S&V_X] | [S&V_Telegram]",
                    "Discover the Reaper agent here: [RG_website] | [RG_X] | [RG_Telegram] | [RG_dexscreener] | [RG_github]"
                ]
            }
        ],
        links: {
            'reaper’s gambit': 'https://x.com/reapers_gambit',
            'reaper agent': 'https://x.com/reapers_gambit',
            'crucible of challenge': 'https://x.com/reapers_gambit',
            'S&V AI index': 'https://x.com/reapers_gambit',
            'nominees list': 'https://x.com/reapers_gambit',
            'S&V_X': 'https://x.com/standardvoids',
            'S&V_Telegram': 'https://t.me/reaper_agent',
            'RG_website': 'https://x.com/standardvoids',
            'RG_X': 'https://x.com/standardvoids',
            'RG_Telegram': 'https://t.me/reaper_agent',
            'RG_dexscreener': 'https://t.me/reaper_agent',
            'RG_site': 'https://standardvoids.com',
            'RG_chart': 'https://dexscreener.com/ethereum/0x2c91d908e9fab2dd2441532a04182d791e590f2d',
            'RG_github': 'https://github.com/qlvos'
        }
    },
    build: {
        sections: [
            {
                title: "THE IDEA",
                content: "The on-chain AI memecoin market is booming, capturing both attention and mindshare. However, discovering and monitoring projects can be tedious and time-consuming for newcomers and market veterans alike. There is no straightforward on-chain method to gain broad exposure to the entire AI sector (or any other). TRADERS have to piece baskets together manually, hoping they choose correctly. Beyond the challenges of discovery, there is also no publicly recognized index to benchmark or track sector-wide performance. As the number of tokens grows, indexing and aggregation become critical to measure, compare, and invest in thriving ecosystems."
            },
            {
                title: "THE S&V AGENT",
                content: "At the core of our platform lies the S&V agent, the voidling, AN aI that gathers knowledge on the projects we curate and keeps track of the performance of the S&V index, serving as an information and communication hub for Standard & Void's audience. We also gave it a wallet and the capacity to trade tokens from our index, triggered by the comings and goings of Pepito the Cat. It interacts directly with users and posts regular updates across our channels about the performance and development of our products. It also has a digital body: a live-generated, entropy-based 3D ASCII animation. The agent autonomously reconfigures this animation to express its feelings. It is the living face of our AI index."
            },
            {
                title: "THE S&V AI INDEX",
                content: "We are building two index products: a pure index and a tradable index token. The first is the result of our curatorial efforts and is used to measure and track the ai X crypto sector. Other builders will be able to use this index for their applications, and we hope investors and financial media will adopt it as a benchmark. The selection of projects for the index will soon be open for votes and submissions. We aim to map as much of the AI sector as possible and only select the most relevant projects for our final curation using a rich set of criteria, balancing community interest, market share, project quality, long-term outlook, and contribution to the sector. Our second index product represents shares from the basket of tokens that the index tracks and will behave as an index fund on-chain. Every index token can be redeemed for the underlying tokens and vice versa. We are developing a system that will be simple and transparent. In traditional finance, this process is reserved for authorized participants. We intend to make ours available to anyone."
            }
        ],
        links: {}
    }
};

async function loadFonts() {
    try {
        await Promise.all([
            document.fonts.load('12px ProtoMono'),
            document.fonts.load('24px ProtoMono')
        ]);
        return true;
    } catch (err) {
        console.error('Font loading error:', err);
        return false;
    }
}

function drawCanvas(timestamp) {
    if (timestamp - lastFrameTime < FRAME_INTERVAL) {
        requestAnimationFrame(drawCanvas);
        return;
    }

    lastFrameTime = timestamp;
    
    const cvs = document.getElementById(INFO_CANVAS);
    const context = cvs.getContext('2d');
    
    const dpr = window.devicePixelRatio || 1;
    let cvd = getCanvasDimensions(INFO_CANVAS);
    cvs.width = cvd.width;
    cvs.height = cvd.height;
    
    context.scale(dpr, dpr);
    context.clearRect(0, 0, cvs.offsetWidth, cvs.offsetHeight);
    
    context.font = getFont();
    context.textAlign = getCanvasTextAlign();
    
    contentRenderer.draw();
    const bufferData = contentRenderer.getBuffer();
    
    const dims = calculateDimensions();
    let currentY = dims.charHeight;
    let currentX = 1;
    
    for (let i = 0; i < bufferData.chars.length; i++) {
        const char = bufferData.chars[i];
        if (char !== ' ') {
            context.fillStyle = bufferData.colors[i] || '#875fff';
            context.fillText(
                char, 
                currentX * dims.charWidth, 
                currentY
            );
        }
        currentX++;
        if ((i + 1) % dims.width === 0) {
            currentY += dims.charHeight;
            currentX = 1;
        }
    }

    requestAnimationFrame(drawCanvas);
}

function handleCanvasClick(event) {
    const dims = calculateDimensions();
    const cvs = document.getElementById(INFO_CANVAS);
    const rect = cvs.getBoundingClientRect();
    
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const charX = Math.floor(mouseX / dims.charWidth);
    const charY = Math.floor(mouseY / dims.charHeight);

  
    manageBorderMouseClick(mouseX, mouseY, [...infoStrings.top, ...infoStrings.bottom], [...infoStrings.left, ...infoStrings.right]);

    contentRenderer.handleClick(charX, charY);
}

export function initInfoPage() {
  const dims = calculateDimensions();
  contentRenderer = new ContentRenderer(dims.width, dims.height, PAGES);
  requestAnimationFrame(drawCanvas);
}

window.addEventListener('resize', () => {
  // todo
  /*
    checkMobile();
    const dims = calculateDimensions();
    if (contentRenderer) {
        contentRenderer.resize(dims.width, dims.height);
    }
        */
});

let canvas = document.getElementById(INFO_CANVAS);

canvas.addEventListener('click', handleCanvasClick);
canvas.addEventListener('mousemove', (event) => {
  if (manageMouseMove(event, canvas.getBoundingClientRect(), [...infoStrings.top, ...infoStrings.bottom], [...infoStrings.left, ...infoStrings.right], canvas)) {
    return;
  }
});
